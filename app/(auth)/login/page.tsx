"use client";
import { useEffect } from "react";
import Script from "next/script";
import "./login.css";

export default function LoginPage() {
  /*
  function decodeJWT(token: string) {
    let base64Url = token.split(".")[1];
    let base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    let jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map(function (c) {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join("")
    );
    return JSON.parse(jsonPayload);
  }

  useEffect(() => {
    (window as any).handleCredentialResponse = handleCredentialResponse;
  }, []);

  function handleCredentialResponse(response: { credential: string }) {
    const responsePayload = decodeJWT(response.credential);
    console.log("  Full Name: " + responsePayload.name);
    // console.log("  Given Name: " + responsePayload.given_name);
    // console.log("  Family Name: " + responsePayload.family_name);
    // console.log("  Unique ID: " + responsePayload.sub);
    // console.log("  Profile image URL: " + responsePayload.picture);
    // console.log("  Email: " + responsePayload.email);
    fetch("/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        // 여기에 responsePayload 정보 들어가면 됨.
      }),
    })
      .then((response) => response.json())
      .then((data) => console.log(data)); // 이 파트도 로그인 쪽 redirect 등등으로 변화 예정.
  }
*/
  return (
    <>
      <Script src="https://accounts.google.com/gsi/client" />
      <div className="page">
        <div className="card">
          <div className="header">
            <img className="img" src="/logo.png" alt="logo" />
            <div className="title">학생회 로그인</div>
            <div
              id="g_id_onload"
              data-auto_prompt="true"
              data-login_uri="http://localhost:3000/api/login"
              //data-callback="handleCredentialResponse"
              data-client_id="57121165236-paes4i9jg5gn8b1h8ao97l0l13m2vmqt.apps.googleusercontent.com" //여기에 Google Oauth client ID 삽입.
            ></div>
            <div className="g_id_signin"></div>
          </div>
        </div>
      </div>
    </>
  );
}
