"use client";

/**
 * Parent Settings Page — Phase 9: Parent Dashboard
 *
 * Fully functional settings with:
 * - Account info display
 * - Children & Kid Login management (set/reset PIN, change username, remove login)
 * - Notification preferences
 * - Sign out button
 */

import { useState, useEffect, useCallback } from "react";
import { useParent } from "@/lib/parent-context";

interface ChildInfo {
  id: string;
  displayName: string;
  gradeLevel: string;
  username: string | null;
  hasKidLogin: boolean;
}

type ChildAction =
  | { type: "idle" }
  | { type: "setup"; childId: string }
  | { type: "reset"; childId: string }
  | { type: "remove"; childId: string };

export default function ParentSettingsPage() {
  const { parentId, email, name, plan } = useParent();

  const [children, setChildren] = useState<ChildInfo[]>([]);
  const [loadingChildren, setLoadingChildren] = useState(true);

  // PIN management state
  const [action, setAction] = useState<ChildAction>({ type: "idle" });
  const [formUsername, setFormUsername] = useState("");
  const [formPin, setFormPin] = useState("");
  const [formPinConfirm, setFormPinConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch children with kid login status
  const fetchChildren = useCallback(async () => {
    if (!parentId) return;
    try {
      const res = await fetch(
        `/api/parent/children?parentId=${encodeURIComponent(parentId)}`
      );
      if (res.ok) {
        const data = await res.json();
        setChildren(data.children ?? []);
      }
    } catch (err) {
      console.error("Failed to fetch children:", err);
    } finally {
      setLoadingChildren(false);
    }
  }, [parentId]);

  useEffect(() => {
    fetchChildren();
  }, [fetchChildren]);

  // Clear messages after 5 seconds
  useEffect(() => {
    if (successMessage || errorMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
        setErrorMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, errorMessage]);

  const resetForm = () => {
    setAction({ type: "idle" });
    setFormUsername("");
    setFormPin("");
    setFormPinConfirm("");
    setErrorMessage(null);
  };

  const startSetup = (childId: string) => {
    resetForm();
    setAction({ type: "setup", childId });
  };

  const startReset = (child: ChildInfo) => {
    resetForm();
    setFormUsername(child.username ?? "");
    setAction({ type: "reset", childId: child.id });
  };

  const startRemove = (childId: string) => {
    resetForm();
    setAction({ type: "remove", childId });
  };

  const handleSetOrResetPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (action.type !== "setup" && action.type !== "reset") return;

    // Client-side validation
    if (!formUsername.trim()) {
      setErrorMessage("Username is required");
      return;
    }
    if (formUsername.trim().length < 3) {
      setErrorMessage("Username must be at least 3 characters");
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(formUsername.trim())) {
      setErrorMessage(
        "Username can only contain letters, numbers, and underscores"
      );
      return;
    }
    if (!formPin) {
      setErrorMessage("PIN is required");
      return;
    }
    if (!/^\d{4}$/.test(formPin)) {
      setErrorMessage("PIN must be exactly 4 digits");
      return;
    }
    if (formPin !== formPinConfirm) {
      setErrorMessage("PINs don't match");
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch(
        `/api/parent/child/${action.childId}/reset-pin`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            parentId,
            username: formUsername.trim().toLowerCase(),
            pin: formPin,
          }),
        }
      );

      const data = await res.json();

      if (res.ok) {
        setSuccessMessage(data.message || "Kid login updated!");
        resetForm();
        fetchChildren(); // Refresh child list
      } else {
        setErrorMessage(data.error || "Failed to update kid login");
      }
    } catch (err) {
      console.error("PIN update error:", err);
      setErrorMessage("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveLogin = async (childId: string) => {
    setSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/parent/child/${childId}/reset-pin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parentId,
          removeLogin: true,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccessMessage(data.message || "Kid login removed");
        resetForm();
        fetchChildren();
      } else {
        setErrorMessage(data.error || "Failed to remove kid login");
      }
    } catch (err) {
      console.error("Remove login error:", err);
      setErrorMessage("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const activeChild =
    action.type !== "idle"
      ? children.find((c) => c.id === action.childId)
      : null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Settings</h2>
        <p className="text-sm text-gray-500 mt-1">
          Manage your account, children, and preferences.
        </p>
      </div>

      {/* Status messages */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700 flex items-center gap-2">
          <span className="text-lg">&#10003;</span>
          {successMessage}
        </div>
      )}
      {errorMessage && action.type === "idle" && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 flex items-center gap-2">
          <span className="text-lg">&#9888;</span>
          {errorMessage}
        </div>
      )}

      {/* Account Section */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h3 className="font-semibold text-gray-900 mb-4">Account</h3>
        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between py-2 border-b border-gray-50">
            <span className="text-gray-500">Name</span>
            <span className="text-gray-900">{name || "—"}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-gray-50">
            <span className="text-gray-500">Email</span>
            <span className="text-gray-900">{email}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-gray-50">
            <span className="text-gray-500">Subscription</span>
            <span className="bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded-full font-medium">
              {plan}
            </span>
          </div>
        </div>
      </div>

      {/* Children & Kid Login Section */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h3 className="font-semibold text-gray-900 mb-1">
          Children &amp; Kid Login
        </h3>
        <p className="text-xs text-gray-500 mb-4">
          Manage your children&apos;s independent login credentials. Kids can
          sign in at the Kid Login page with their username and 4-digit PIN.
        </p>

        {loadingChildren ? (
          <div className="animate-pulse text-gray-400 text-sm py-4">
            Loading children...
          </div>
        ) : children.length === 0 ? (
          <div className="text-sm text-gray-500 py-4 text-center">
            No children added yet. Add a child from the{" "}
            <a href="/dashboard" className="text-purple-600 hover:underline">
              Dashboard
            </a>
            .
          </div>
        ) : (
          <div className="space-y-3">
            {children.map((child) => {
              const isActiveChild =
                action.type !== "idle" && action.childId === child.id;

              return (
                <div key={child.id}>
                  {/* Child row */}
                  <div
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      isActiveChild
                        ? "border-purple-200 bg-purple-50/50"
                        : "border-gray-100 hover:bg-gray-50"
                    } transition-colors`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-sm">
                        {child.displayName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {child.displayName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {child.hasKidLogin ? (
                            <>
                              Username:{" "}
                              <span className="font-mono text-purple-600">
                                {child.username}
                              </span>
                            </>
                          ) : (
                            <span className="text-gray-400">
                              No kid login set up
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {child.hasKidLogin ? (
                        <>
                          <button
                            onClick={() => startReset(child)}
                            disabled={
                              action.type !== "idle" &&
                              action.childId !== child.id
                            }
                            className="px-3 py-1.5 text-xs font-medium text-purple-600 hover:bg-purple-50 rounded-lg transition-colors disabled:opacity-40"
                          >
                            Reset PIN
                          </button>
                          <button
                            onClick={() => startRemove(child.id)}
                            disabled={
                              action.type !== "idle" &&
                              action.childId !== child.id
                            }
                            className="px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40"
                          >
                            Remove
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => startSetup(child.id)}
                          disabled={
                            action.type !== "idle" &&
                            action.childId !== child.id
                          }
                          className="px-3 py-1.5 text-xs font-medium bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-40"
                        >
                          Set Up Kid Login
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Inline form for setup/reset */}
                  {isActiveChild &&
                    (action.type === "setup" || action.type === "reset") && (
                      <div className="mt-2 ml-11 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <h4 className="text-sm font-medium text-gray-900 mb-3">
                          {action.type === "setup"
                            ? `Set up Kid Login for ${activeChild?.displayName}`
                            : `Reset PIN for ${activeChild?.displayName}`}
                        </h4>
                        <form
                          onSubmit={handleSetOrResetPin}
                          className="space-y-3"
                        >
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Username
                            </label>
                            <input
                              type="text"
                              value={formUsername}
                              onChange={(e) =>
                                setFormUsername(
                                  e.target.value.replace(/[^a-zA-Z0-9_]/g, "")
                                )
                              }
                              placeholder="e.g. arjun_star"
                              className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                              maxLength={20}
                              autoFocus
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3 max-w-xs">
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                New 4-Digit PIN
                              </label>
                              <input
                                type="text"
                                inputMode="numeric"
                                value={formPin}
                                onChange={(e) =>
                                  setFormPin(
                                    e.target.value
                                      .replace(/\D/g, "")
                                      .slice(0, 4)
                                  )
                                }
                                placeholder="e.g. 5728"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                maxLength={4}
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                Confirm PIN
                              </label>
                              <input
                                type="text"
                                inputMode="numeric"
                                value={formPinConfirm}
                                onChange={(e) =>
                                  setFormPinConfirm(
                                    e.target.value
                                      .replace(/\D/g, "")
                                      .slice(0, 4)
                                  )
                                }
                                placeholder="Re-enter"
                                className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                                  formPinConfirm && formPinConfirm !== formPin
                                    ? "border-red-300 bg-red-50"
                                    : "border-gray-300"
                                }`}
                                maxLength={4}
                              />
                            </div>
                          </div>

                          {formPinConfirm &&
                            formPinConfirm !== formPin && (
                              <p className="text-xs text-red-500">
                                PINs don&apos;t match
                              </p>
                            )}

                          {errorMessage && isActiveChild && (
                            <p className="text-xs text-red-500">
                              {errorMessage}
                            </p>
                          )}

                          <div className="flex gap-2 pt-1">
                            <button
                              type="submit"
                              disabled={submitting}
                              className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors"
                            >
                              {submitting
                                ? "Saving..."
                                : action.type === "setup"
                                  ? "Set Up Login"
                                  : "Update PIN"}
                            </button>
                            <button
                              type="button"
                              onClick={resetForm}
                              className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      </div>
                    )}

                  {/* Confirm removal */}
                  {isActiveChild && action.type === "remove" && (
                    <div className="mt-2 ml-11 p-4 bg-red-50 rounded-lg border border-red-200">
                      <p className="text-sm text-red-800 mb-3">
                        Remove kid login for{" "}
                        <strong>{activeChild?.displayName}</strong>? They
                        won&apos;t be able to sign in independently until you
                        set it up again.
                      </p>
                      {errorMessage && isActiveChild && (
                        <p className="text-xs text-red-500 mb-2">
                          {errorMessage}
                        </p>
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleRemoveLogin(action.childId)}
                          disabled={submitting}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
                        >
                          {submitting ? "Removing..." : "Yes, Remove Login"}
                        </button>
                        <button
                          onClick={resetForm}
                          className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Tip box */}
        <div className="mt-4 bg-blue-50 border border-blue-100 rounded-lg p-3">
          <p className="text-xs text-blue-700">
            <strong>Tip:</strong> Your child can sign in independently at{" "}
            <span className="font-mono bg-blue-100 px-1 rounded">
              /kid-login
            </span>{" "}
            using their username and 4-digit PIN. PINs should be easy for your
            child to remember but not too simple (like 0000 or 1111).
          </p>
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h3 className="font-semibold text-gray-900 mb-4">
          Notification Preferences
        </h3>
        <p className="text-xs text-gray-400 mb-3">
          Coming soon — email notifications for milestones and reports.
        </p>
        <div className="space-y-3 opacity-60 pointer-events-none">
          <label className="flex items-center justify-between">
            <span className="text-sm text-gray-700">
              Weekly report emails
            </span>
            <input
              type="checkbox"
              defaultChecked
              className="w-4 h-4 text-purple-600 rounded"
              disabled
            />
          </label>
          <label className="flex items-center justify-between">
            <span className="text-sm text-gray-700">
              Badge &amp; milestone alerts
            </span>
            <input
              type="checkbox"
              defaultChecked
              className="w-4 h-4 text-purple-600 rounded"
              disabled
            />
          </label>
          <label className="flex items-center justify-between">
            <span className="text-sm text-gray-700">Streak reminders</span>
            <input
              type="checkbox"
              defaultChecked
              className="w-4 h-4 text-purple-600 rounded"
              disabled
            />
          </label>
        </div>
      </div>

      {/* Sign Out */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h3 className="font-semibold text-gray-900 mb-3">Session</h3>
        <a
          href="/api/auth/logout"
          className="inline-flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors"
        >
          Sign Out
        </a>
        <p className="text-xs text-gray-400 mt-2">
          You will be redirected to the home page after signing out.
        </p>
      </div>
    </div>
  );
}
