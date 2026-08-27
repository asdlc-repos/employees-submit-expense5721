import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Center } from "@astryxdesign/core/Center";
import { Spinner } from "@astryxdesign/core/Spinner";
import { handleCallback } from "../auth";

export default function Callback() {
  const navigate = useNavigate();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    handleCallback()
      .catch(() => {
        // Nothing to recover client-side — send the user back to "/" where
        // AuthProvider will restart sign-in.
      })
      .finally(() => navigate("/", { replace: true }));
  }, [navigate]);

  return (
    <Center height="100vh">
      <Spinner size="lg" label="Completing sign-in..." />
    </Center>
  );
}
