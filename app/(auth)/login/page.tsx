"use client";
import { useEffect } from "react";
import Script from "next/script";
import "./login.css";

export default function LoginPage() {
  function decodeJWT(token: string) {
    let base64Url = token.split(".")[1];
    let base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    let jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map(function (c) {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join(""),
    );
    return JSON.parse(jsonPayload);
  }

  useEffect(() => {
    if (!window.google) return;

    window.google.accounts.id.initialize({
      client_id:
        "970543082215-2gufle8v8uri3ch84u7m3l1bbmmut7qr.apps.googleusercontent.com", //이 파트에 SSO Oauith client ID key

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
    <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" />
    <div className="page">
      <div className="card">
        <div className="header">
          <img className="img" src="/logo.png" alt="logo" />
          <div className="title">학생회 로그인</div>
        </div>
        <button className="google-btn" onClick={handleGoogleLogin}>
          Google로 로그인
        </button>
      </div>
    </div>
  </>
)
}
