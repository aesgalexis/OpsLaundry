/* eslint-disable max-len */
import {emailText, renderTransactionalEmail} from "../email/transactional";

const confirmations = {
  es: {subject: "Propuesta de máquina recibida", title: "Hemos recibido tu propuesta", greeting: "Hola", received: "Gracias por enviarnos los datos de tu máquina. La propuesta está pendiente de valoración y todavía no está publicada.", next: "Revisaremos la información y contactaremos contigo si necesitamos más detalles.", reference: "Referencia de tu solicitud", machine: "Tu máquina", brand: "Marca", model: "Modelo", footer: "OpsLaundry te ha enviado esta confirmación. Puedes responder a este correo si necesitas añadir información."},
  en: {subject: "Machine proposal received", title: "We have received your proposal", greeting: "Hello", received: "Thank you for sending us your machine details. Your proposal is awaiting review and has not been published.", next: "We will review the information and contact you if we need further details.", reference: "Your request reference", machine: "Your machine", brand: "Brand", model: "Model", footer: "OpsLaundry sent you this confirmation. You can reply to this email to add information."},
  it: {subject: "Proposta di macchina ricevuta", title: "Abbiamo ricevuto la tua proposta", greeting: "Ciao", received: "Grazie per averci inviato i dati della tua macchina. La proposta è in attesa di valutazione e non è ancora pubblicata.", next: "Esamineremo le informazioni e ti contatteremo se avremo bisogno di ulteriori dettagli.", reference: "Riferimento della richiesta", machine: "La tua macchina", brand: "Marca", model: "Modello", footer: "OpsLaundry ti ha inviato questa conferma. Puoi rispondere a questa email per aggiungere informazioni."},
  el: {subject: "Λάβαμε την πρόταση μηχανήματος", title: "Λάβαμε την πρότασή σας", greeting: "Γεια σας", received: "Ευχαριστούμε που μας στείλατε τα στοιχεία του μηχανήματός σας. Η πρόταση αναμένει αξιολόγηση και δεν έχει δημοσιευτεί ακόμη.", next: "Θα εξετάσουμε τις πληροφορίες και θα επικοινωνήσουμε μαζί σας αν χρειαστούμε περισσότερες λεπτομέρειες.", reference: "Κωδικός αιτήματος", machine: "Το μηχάνημά σας", brand: "Μάρκα", model: "Μοντέλο", footer: "Η OpsLaundry σάς έστειλε αυτή την επιβεβαίωση. Μπορείτε να απαντήσετε σε αυτό το email για να προσθέσετε πληροφορίες."},
};
type Input = {language: string; contact: {name: string; email: string; phone: string; company: string}; draft: Record<string, unknown>; imageCount: number};

export const renderMachineSubmissionEmails = (id: string, data: Input) => {
  const draft = data.draft;
  const reference = emailText(id);
  const link = `https://opslaundry.com/requests/?request=${encodeURIComponent(id)}`;
  const fields: Array<[string, string]> = [["Tipo", "categoria"], ["Marca", "marca"], ["Modelo", "modelo"], ["Capacidad (kg)", "capacidad"], ["Año", "anio"], ["Estado", "estado"], ["Ubicación", "ubicacion"], ["Precio (EUR, sin impuestos)", "precio"], ["Calefacción", "calefaccion"], ["Garantía (meses)", "garantiaDetalle"], ["Comentarios", "comentarios"]];
  const machineRows: Array<[string, string]> = fields.filter(([, key]) => emailText(draft[key])).map(([label, key]) => [label, emailText(draft[key])]);
  if (draft.garantiaTipo) machineRows.push(["Tipo de garantía", draft.garantiaTipo === "total" ? "Total" : "Piezas"]);
  machineRows.push(["Envío incluido", draft.envioIncluido === true ? "Sí" : "No"], ["Puesta en marcha incluida", draft.puestaEnMarchaIncluida === true ? "Sí" : "No"], ["Fotografías", String(data.imageCount)]);
  const contactRows: Array<[string, string]> = [["Nombre", data.contact.name], ["Correo", data.contact.email], ["Teléfono", data.contact.phone]];
  if (data.contact.company) contactRows.push(["Empresa", data.contact.company]);
  const sections = [{title: "Datos de contacto", rows: contactRows}, {title: "Datos de la máquina", rows: machineRows}];
  const internal = {
    subject: emailText(`Máquina pendiente: ${draft.marca} ${draft.modelo || ""}`),
    html: renderTransactionalEmail({language: "es", title: "Nueva máquina pendiente de revisión", greeting: "Hola,", paragraphs: ["Has recibido una propuesta de maquinaria. Revisa los datos y las fotografías antes de decidir su publicación.", "La máquina todavía no está publicada. Las fotografías están disponibles en la solicitud privada."], reference, referenceLabel: "Referencia de la solicitud", sections, button: {label: "Revisar solicitud", url: link}, footer: "Aviso de OpsLaundry. Responde a este correo para contactar con la persona que ha enviado la propuesta."}),
    text: emailText(["Nueva máquina pendiente de revisión", "La máquina todavía no está publicada.", `Referencia: ${reference}`, ...sections.flatMap((section) => ["", section.title, ...section.rows.map(([label, value]) => `${label}: ${value}`)]), "", `Revisar solicitud y fotografías: ${link}`].join("\n")),
  };
  const language = Object.prototype.hasOwnProperty.call(confirmations, data.language) ? data.language as keyof typeof confirmations : "es";
  const copy = confirmations[language];
  const greeting = `${copy.greeting}${data.contact.name ? " " + emailText(data.contact.name) : ""},`;
  const rows: Array<[string, string]> = [[copy.brand, emailText(draft.marca)]];
  if (draft.modelo) rows.push([copy.model, emailText(draft.modelo)]);
  const confirmation = {
    subject: `${copy.subject} · ${reference.slice(0, 8)}`,
    html: renderTransactionalEmail({language, title: copy.title, greeting, paragraphs: [copy.received, copy.next], reference, referenceLabel: copy.reference, sections: [{title: copy.machine, rows}], footer: copy.footer}),
    text: [greeting, "", copy.received, copy.next, "", `${copy.reference}: ${reference}`, ...rows.map(([label, value]) => `${label}: ${value}`), "", copy.footer, "https://opslaundry.com/"].join("\n"),
  };
  return {internal, confirmation};
};
