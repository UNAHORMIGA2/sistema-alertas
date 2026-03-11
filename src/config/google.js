let GoogleSigninModule = null;
let configured = false;

export const ANDROID_PACKAGE_NAME = "com.unahormiga2.sistemaalertas";
export const DEBUG_SHA1 = "5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25";

export function getGoogleSignin() {
  if (GoogleSigninModule) {
    return GoogleSigninModule;
  }

  try {
    GoogleSigninModule = require("@react-native-google-signin/google-signin").GoogleSignin;
    return GoogleSigninModule;
  } catch {
    return null;
  }
}

export function configureGoogleSignin() {
  if (configured) {
    return true;
  }

  const GoogleSignin = getGoogleSignin();
  if (!GoogleSignin) {
    return false;
  }

  GoogleSignin.configure({
    webClientId: "965961286862-auggl8a4nuecdpvupmj5q6s5dorjdb3b.apps.googleusercontent.com",
    iosClientId: "965961286862-9p3r2okqi2su4814q2tdoa2ki3dphgon.apps.googleusercontent.com",
    offlineAccess: true,
  });

  configured = true;
  return true;
}
