"use client";

import { useEffect } from "react";
import Script from "next/script";
import "./login.css";

export default function LoginPage() {
  useEffect(() => {
    if (!window.google) return;

    window.google.accounts.id.initialize({
      client_id:
        "", //이 파트에 SSO Oauith client ID key

      callback: async (response) => {
        console.log("Google Login Success");

        try {
          const res = await fetch("/api/login", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              credential: response.credential,
            }),
          });

          const data = await res.json();
          console.log(data);
        } catch (err) {
          console.error(err);
        }
      },
    });
  }, []);

  const handleGoogleLogin = () => {
    window.google?.accounts.id.prompt();
  };

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
      />

      <div className="page">
        <div className="card">
          <div className="header">
            <img className="img" src="/logo.png" alt="logo" />
            <div className="title">학생회 로그인</div>
          </div>

          <button
            className="google-btn"
            onClick={handleGoogleLogin}
          >
            <svg
              className="google-icon"
              viewBox="0 0 48 48"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fill="#FFC107"
                d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 3l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z"
              />
              <path
                fill="#FF3D00"
                d="M6.3 14.7l6.6 4.8C14.7 15 18.9 12 24 12c3 0 5.7 1.1 7.8 3l5.7-5.7C34.1 6.1 29.3 4 24 4c-7.7 0-14.3 4.3-17.7 10.7z"
              />
              <path
                fill="#4CAF50"
                d="M24 44c5.2 0 9.9-2 13.5-5.2l-6.2-5.2c-2.1 1.6-4.6 2.4-7.3 2.4-5.3 0-9.8-3.3-11.4-8l-6.5 5C9.4 39.6 16.1 44 24 44z"
              />
              <path
                fill="#1976D2"
                d="M43.6 20.5H42V20H24v8h11.3c-1.1 3.1-3.3 5.4-6 6.9l.1-.1 6.2 5.2C35.2 40.3 44 34 44 24c0-1.3-.1-2.3-.4-3.5z"
              />
            </svg>

            <span>Google로 로그인</span>
          </button>
        </div>
      </div>
    </>
  );
}