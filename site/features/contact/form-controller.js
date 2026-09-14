export const CONTACT_FORM_MESSAGES = Object.freeze({
  es: Object.freeze({
    sending: "Enviando...",
    nameRequired: "Escribe tu nombre.",
    emailRequired: "Escribe tu correo electrónico.",
    messageRequired: "Escribe un mensaje.",
    required: "Completa este campo.",
    emailInvalid: "Introduce un correo electrónico válido.",
    invalid: "Revisa el valor de este campo.",
    privacyRequired: "Acepta la política de privacidad y cookies para enviar el mensaje.",
    success: "Mensaje enviado correctamente.",
    sendError: "No se ha podido enviar el mensaje. Inténtalo de nuevo más tarde.",
    networkError: "No se ha podido conectar. Comprueba tu conexión e inténtalo de nuevo.",
  }),
  en: Object.freeze({
    sending: "Sending...",
    nameRequired: "Please enter your name.",
    emailRequired: "Please enter your email address.",
    messageRequired: "Please enter a message.",
    required: "Please fill in this field.",
    emailInvalid: "Please enter a valid email address.",
    invalid: "Please check the value of this field.",
    privacyRequired: "Please accept the privacy and cookies policy to send your message.",
    success: "Message sent successfully.",
    sendError: "The message could not be sent. Please try again later.",
    networkError: "Could not connect. Check your connection and try again.",
  }),
  it: Object.freeze({
    sending: "Invio in corso...",
    nameRequired: "Inserisci il tuo nome.",
    emailRequired: "Inserisci il tuo indirizzo email.",
    messageRequired: "Scrivi un messaggio.",
    required: "Compila questo campo.",
    emailInvalid: "Inserisci un indirizzo email valido.",
    invalid: "Controlla il valore di questo campo.",
    privacyRequired: "Accetta l’informativa sulla privacy e sui cookie per inviare il messaggio.",
    success: "Messaggio inviato correttamente.",
    sendError: "Non è stato possibile inviare il messaggio. Riprova più tardi.",
    networkError: "Impossibile connettersi. Controlla la connessione e riprova.",
  }),
  el: Object.freeze({
    sending: "Αποστολή...",
    nameRequired: "Συμπληρώστε το όνομά σας.",
    emailRequired: "Συμπληρώστε τη διεύθυνση email σας.",
    messageRequired: "Γράψτε ένα μήνυμα.",
    required: "Συμπληρώστε αυτό το πεδίο.",
    emailInvalid: "Εισαγάγετε μια έγκυρη διεύθυνση email.",
    invalid: "Ελέγξτε την τιμή αυτού του πεδίου.",
    privacyRequired: "Αποδεχτείτε την πολιτική απορρήτου και cookies για να στείλετε το μήνυμα.",
    success: "Το μήνυμα στάλθηκε επιτυχώς.",
    sendError: "Δεν ήταν δυνατή η αποστολή του μηνύματος. Δοκιμάστε ξανά αργότερα.",
    networkError: "Δεν ήταν δυνατή η σύνδεση. Ελέγξτε τη σύνδεσή σας και δοκιμάστε ξανά.",
  }),
});

const normalizeLanguage = (language) => {
  const normalized = String(language || document.documentElement.lang || "es").slice(0, 2).toLowerCase();
  return CONTACT_FORM_MESSAGES[normalized] ? normalized : "es";
};

export const initContactForm = (form, options = {}) => {
  if (!form || form.dataset.contactFormReady === "true") return;
  form.dataset.contactFormReady = "true";

  const status = form.querySelector(options.statusSelector || ".form-status");
  const submitButton = form.querySelector(options.submitSelector || 'button[type="submit"]');
  const honeypot = form.querySelector('input[name="_gotcha"]');
  const messages = CONTACT_FORM_MESSAGES[normalizeLanguage(options.language)];
  const fields = [...form.querySelectorAll("input, select, textarea")];
  const requiredMessages = {
    nombre: messages.nameRequired,
    email: messages.emailRequired,
    mensaje: messages.messageRequired,
    privacy_consent: messages.privacyRequired,
  };
  const validateField = (field) => {
    field.setCustomValidity("");
    if (!field.willValidate) return;
    if (field.validity.valueMissing) {
      field.setCustomValidity(requiredMessages[field.name] || messages.required);
    } else if (field.type === "email" && field.validity.typeMismatch) {
      field.setCustomValidity(messages.emailInvalid);
    } else if (!field.validity.valid) {
      field.setCustomValidity(messages.invalid);
    }
  };
  for (const field of fields) {
    field.addEventListener("input", () => validateField(field));
    field.addEventListener("change", () => validateField(field));
    field.addEventListener("invalid", () => validateField(field));
  }
  form.addEventListener("reset", () => {
    for (const field of fields) field.setCustomValidity("");
  });

  const setStatus = (message, state) => {
    if (!status) return;
    status.hidden = false;
    status.textContent = message;
    if (state) status.dataset.state = state;
    else delete status.dataset.state;
  };

  let submitting = false;
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (submitting) return;
    if (honeypot?.value) return;
    fields.forEach(validateField);
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    submitting = true;
    setStatus(messages.sending);
    if (submitButton) submitButton.disabled = true;

    try {
      const response = await fetch(form.action, {
        method: form.method || "POST",
        body: new FormData(form),
        headers: {Accept: "application/json"},
      });

      if (!response.ok) {
        setStatus(messages.sendError, "error");
        return;
      }

      setStatus(messages.success, "success");
      form.reset();
    } catch {
      setStatus(messages.networkError, "error");
    } finally {
      submitting = false;
      if (submitButton) submitButton.disabled = false;
    }
  });
};
