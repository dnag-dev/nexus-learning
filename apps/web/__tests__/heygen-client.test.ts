/**
 * HeyGen LiveAvatar Client Tests
 * - Avatar ID mapping for all personas
 * - Config/fallback when API key not set
 * - createSessionToken mock lifecycle (LiveAvatar API)
 * - isHeyGenAvailable / getAvatarId helpers
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { AVATAR_ID_MAP, getConfig, DEFAULT_AVATAR_ID, DEFAULT_HEYGEN_VOICE_ID, LIVEAVATAR_API_URL } from "../lib/avatar/heygen-client";
import type { PersonaId } from "../lib/personas/persona-config";

const ALL_PERSONA_IDS: PersonaId[] = [
  "cosmo", "luna", "rex", "nova", "pip",
  "atlas", "zara", "finn", "echo", "sage",
  "bolt", "ivy", "max", "aria",
];

// ─── Avatar ID Mapping ───

describe("LiveAvatar — AVATAR_ID_MAP", () => {
  it("maps all 14 personas to avatar IDs", () => {
    expect(Object.keys(AVATAR_ID_MAP)).toHaveLength(14);
  });

  ALL_PERSONA_IDS.forEach((pid) => {
    it(`has avatar ID for ${pid}`, () => {
      expect(AVATAR_ID_MAP[pid]).toBeDefined();
      expect(typeof AVATAR_ID_MAP[pid]).toBe("string");
      expect(AVATAR_ID_MAP[pid].length).toBeGreaterThan(0);
    });
  });

  it("all personas use the default avatar ID for now", () => {
    ALL_PERSONA_IDS.forEach((pid) => {
      expect(AVATAR_ID_MAP[pid]).toBe(DEFAULT_AVATAR_ID);
    });
  });
});

// ─── API URL ───

describe("LiveAvatar — API URL", () => {
  it("uses the correct LiveAvatar API URL", () => {
    expect(LIVEAVATAR_API_URL).toBe("https://api.liveavatar.com");
  });
});

// ─── Config / Fallback ───

describe("LiveAvatar — getConfig fallback", () => {
  const originalEnv = process.env.HEYGEN_API_KEY;

  beforeEach(() => {
    vi.resetModules();
    delete process.env.HEYGEN_API_KEY;
  });

  afterEach(() => {
    if (originalEnv) {
      process.env.HEYGEN_API_KEY = originalEnv;
    } else {
      delete process.env.HEYGEN_API_KEY;
    }
  });

  it("returns null when API key is not configured", async () => {
    const mod = await import("../lib/avatar/heygen-client");
    const config = mod.getConfig();
    expect(config).toBeNull();
  });

  it("returns null when API key is placeholder", async () => {
    process.env.HEYGEN_API_KEY = "YOUR_HEYGEN_API_KEY";
    const mod = await import("../lib/avatar/heygen-client");
    const config = mod.getConfig();
    expect(config).toBeNull();
  });
});

// ─── createSessionToken with mocked fetch (LiveAvatar API) ───

describe("LiveAvatar — createSessionToken success", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.resetModules();
    process.env.HEYGEN_API_KEY = "test-liveavatar-key-12345";
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    delete process.env.HEYGEN_API_KEY;
  });

  it("returns sessionToken and sessionId on successful API call", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          data: {
            session_token: "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.test_session_token",
            session_id: "session-abc-123",
          },
        }),
    });

    const mod = await import("../lib/avatar/heygen-client");
    const result = await mod.createSessionToken();

    expect(result).not.toBeNull();
    expect(result!.sessionToken).toContain("eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9");
    expect(result!.sessionId).toBe("session-abc-123");
    expect(result!.createdAt).toBeInstanceOf(Date);

    // Verify it called the correct LiveAvatar endpoint
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    const call = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(call[0]).toBe("https://api.liveavatar.com/v1/sessions/token");
    expect(call[1].headers["X-API-KEY"]).toBe("test-liveavatar-key-12345");
    expect(call[1].headers["Content-Type"]).toBe("application/json");

    // Verify request body
    const body = JSON.parse(call[1].body);
    expect(body.mode).toBe("FULL");
    expect(body.avatar_id).toBe(DEFAULT_AVATAR_ID);
    expect(body.avatar_persona).toBeDefined();
    expect(body.avatar_persona.voice_id).toBe(DEFAULT_HEYGEN_VOICE_ID);
    expect(body.avatar_persona.language).toBe("en");
    expect(body.is_sandbox).toBe(false);
  });

  it("passes custom avatarId when provided", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          data: {
            session_token: "test_token",
            session_id: "test_session",
          },
        }),
    });

    const mod = await import("../lib/avatar/heygen-client");
    await mod.createSessionToken("custom-avatar-id");

    const call = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const body = JSON.parse(call[1].body);
    expect(body.avatar_id).toBe("custom-avatar-id");
  });
});

describe("LiveAvatar — createSessionToken API error", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.resetModules();
    process.env.HEYGEN_API_KEY = "test-liveavatar-key-error";
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    delete process.env.HEYGEN_API_KEY;
  });

  it("returns null on API error", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: "Unauthorized",
      headers: new Headers({ "content-type": "application/json" }),
      json: () => Promise.resolve({ message: "Unauthorized" }),
    });

    const mod = await import("../lib/avatar/heygen-client");
    const result = await mod.createSessionToken();

    expect(result).toBeNull();
  });
});

describe("LiveAvatar — createSessionToken network error", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.resetModules();
    process.env.HEYGEN_API_KEY = "test-liveavatar-key-network";
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    delete process.env.HEYGEN_API_KEY;
  });

  it("returns null on network error", async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

    const mod = await import("../lib/avatar/heygen-client");
    const result = await mod.createSessionToken();

    expect(result).toBeNull();
  });
});

describe("LiveAvatar — createSessionToken no token in response", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.resetModules();
    process.env.HEYGEN_API_KEY = "test-liveavatar-key-notoken";
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    delete process.env.HEYGEN_API_KEY;
  });

  it("returns null when response has no session_token", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: {} }),
    });

    const mod = await import("../lib/avatar/heygen-client");
    const result = await mod.createSessionToken();

    expect(result).toBeNull();
  });
});

describe("LiveAvatar — createSessionToken when not configured", () => {
  beforeEach(() => {
    vi.resetModules();
    delete process.env.HEYGEN_API_KEY;
  });

  it("returns null when API key is not set", async () => {
    const mod = await import("../lib/avatar/heygen-client");
    const result = await mod.createSessionToken();

    expect(result).toBeNull();
  });
});

// ─── isHeyGenAvailable ───

describe("LiveAvatar — isHeyGenAvailable", () => {
  beforeEach(() => {
    vi.resetModules();
    delete process.env.HEYGEN_API_KEY;
  });

  it("returns false when not configured", async () => {
    const mod = await import("../lib/avatar/heygen-client");
    expect(mod.isHeyGenAvailable()).toBe(false);
  });
});

// ─── getAvatarId ───

describe("LiveAvatar — getAvatarId", () => {
  it("returns the default avatar ID for all personas", async () => {
    const mod = await import("../lib/avatar/heygen-client");
    expect(mod.getAvatarId("cosmo")).toBe(DEFAULT_AVATAR_ID);
    expect(mod.getAvatarId("bolt")).toBe(DEFAULT_AVATAR_ID);
    expect(mod.getAvatarId("aria")).toBe(DEFAULT_AVATAR_ID);
  });

  it("getDefaultAvatarId returns the test avatar", async () => {
    const mod = await import("../lib/avatar/heygen-client");
    expect(mod.getDefaultAvatarId()).toBe(DEFAULT_AVATAR_ID);
  });
});
