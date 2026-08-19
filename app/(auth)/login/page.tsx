"use client";
import { useEffect } from "react";
import Script from "next/script";
import "./login.css";
import { handleBuildComplete } from "next/dist/build/adapter/build-complete";

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
  
  function appendToCookie(cookieName: any, newValue: any, expiryDays = 7) {
    // 1. Find and extract the existing cookie value
    let existingValue = "";
    const cookies = document.cookie.split('; ');
    const cookiePair = cookies.find(row => row.startsWith(cookieName + '='));
    
    if (cookiePair) {
        existingValue = decodeURIComponent(cookiePair.split('=')[1]);
    }

    // 2. Append the new value (using a comma separator if data already exists)
    let updatedValue = existingValue ? existingValue + ',' + newValue : newValue;

    // 3. Set the expiration date
    const date = new Date();
    date.setTime(date.getTime() + (expiryDays * 24 * 60 * 60 * 1000));
    const expires = "; expires=" + date.toUTCString();

    // 4. Save back to the browser
    document.cookie = cookieName + "=" + encodeURIComponent(updatedValue) + expires + "; path=/; SameSite=Lax";
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
        "credential": response.credential
      }),
    })
      .then((response) => response.json())
      .then((data) => dataRecv(data)); // 이 파트도 로그인 쪽 redirect 등등으로 변화 예정.
  }

  function dataRecv(data: any) {
    //console.log(data.role);
    if(data.verification == 'user' || 'admin') {
      appendToCookie('token', data.verification);
      window.location.replace('/');
    }
  }

  return (
    <>
      <Script src="https://accounts.google.com/gsi/client" />
      <div className="page">
        <div className="card">
          <div className="header">
            <img className="img" src="/logo.png" alt="logo" />
            <div className="title">학생회 로그인</div>
            <div  onClick={() => window.location.reload()} 
              id="g_id_onload"
              data-auto_prompt="true"
              data-login_uri="http://localhost:3000/api/login"
              data-callback="handleCredentialResponse"
              data-client_id="977754668487-fne0kbulc5it3rkqkgc4v2l3oe851e9l.apps.googleusercontent.com" //여기에 Google Oauth client ID 삽입.
              //data-client_id="57121165236-paes4i9jg5gn8b1h8ao97l0l13m2vmqt.apps.googleusercontent.com"
            ></div>
            <div className="g_id_signin"></div>
          </div>
        </div>
      </div>
    </>
  );
}
