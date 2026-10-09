import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { errorMessage } from "../../shared/api";
import type { StudentProfileResponse } from "../../models/profile.model";
import { ProfileService } from "../../services/profile.service";
import { useAuth } from "../auth/AuthProvider";

/** Hồ sơ sinh viên (`GET /student/profile`), tự tải lại khi màn được focus. */
export function useProfile() {
  const { request } = useAuth();
  const service = useMemo(() => new ProfileService(request), [request]);
  const [profile, setProfile] = useState<StudentProfileResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setProfile(await service.get());
      setError(null);
    } catch (reason) {
      setError(errorMessage(reason));
    }
  }, [service]);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  return { profile, error, loading: profile === null && !error, reload, service };
}
