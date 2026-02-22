"use client";

import { createContext, useContext } from "react";

interface TeacherContextValue {
  teacherId: string; // TeacherProfile.id
  userId: string; // User.id
  email: string;
  name: string;
  schoolName: string | null;
}

export const TeacherContext = createContext<TeacherContextValue>({
  teacherId: "",
  userId: "",
  email: "",
  name: "",
  schoolName: null,
});

export function useTeacher() {
  return useContext(TeacherContext);
}
