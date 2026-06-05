import { initializeApp } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js";
import { getAuth, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyBDJ0YCGOgDkaXa9IkbVb5Z8CRq5KYN0bk",
    authDomain: "ascendia-e0dcb.firebaseapp.com",
    projectId: "ascendia-e0dcb",
    storageBucket: "ascendia-e0dcb.firebasestorage.app",
    messagingSenderId: "780247264588",
    appId: "1:780247264588:web:79fac9b47e86a645ff73e9"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

window.reinitialiser = function() {
    const e_mail = document.getElementById("email").value;
    const erreur = document.getElementById("erreur");
    const succes = document.getElementById("succes");

    if (!e_mail) {
        alert("Veuillez entrer votre email");
        return;
    }

    erreur.style.display = "none";
    succes.style.display = "none";

    sendPasswordResetEmail(auth, e_mail)
        .then(() => {
            succes.style.display = "block";
        })
        .catch((error) => {
            if (error.code === "auth/user-not-found") {
                erreur.style.display = "block";
            } else {
                alert("Erreur : " + error.message);
            }
        });
}
