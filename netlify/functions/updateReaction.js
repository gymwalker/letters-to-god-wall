<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Letters to God Wall</title>
  <style>
    body {
      font-family: 'Open Sans', sans-serif;
      background-color: #f4f1ed;
      color: #333;
      margin: 0;
      padding: 20px;
    }
    .letter-preview {
      background: #fff;
      border-radius: 12px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
      margin-bottom: 20px;
      padding: 20px;
    }
    .letter-header {
      font-weight: bold;
      font-size: 1.2rem;
      margin-bottom: 10px;
    }
    .letter-snippet {
      margin-bottom: 10px;
    }
    .read-more {
      background-color: #c66b3d;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 8px;
      cursor: pointer;
    }
    .reaction-buttons {
      margin-top: 20px;
    }
    .reaction-buttons button {
      font-size: 1.2rem;
      margin-right: 10px;
      cursor: pointer;
      background: none;
      border: none;
    }
    .modal {
      display: none;
      position: fixed;
      z-index: 1000;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      overflow: auto;
      background-color: rgba(0, 0, 0, 0.6);
    }
    .modal-content {
      background-color: #fff;
      margin: 10% auto;
      padding: 20px;
      border-radius: 12px;
      width: 80%;
      max-width: 600px;
    }
    .close {
      color: #aaa;
      float: right;
      font-size: 28px;
      font-weight: bold;
      cursor: pointer;
    }
    textarea {
      width: 100%;
      height: 150px;
      margin-top: 10px;
    }
  </style>
</head>
<body>
  <h1>Letters to God Wall</h1>
  <div id="letters-container"></div>

  <div id="letter-modal" class="modal">
    <div class="modal-content">
      <span class="close" onclick="closeModal()">&times;</span>
      <h2 id="modal-author">Anonymous</h2>
      <label for="modal-letter">Letter Content:</label>
      <textarea id="modal-letter" readonly></textarea>
      <label for="modal-response">Moderator Response:</label>
      <textarea id="modal-response" readonly></textarea>
      <div class="reaction-buttons">
        <button onclick="sendReactionFromModal('Prayer Count')">🙏</button>
        <button onclick="sendReactionFromModal('Hearts Count')">❤️</button>
        <button onclick="sendReactionFromModal('Broken Hearts Count')">💔</button>
      </div>
    </div>
  </div>

  <script>
    const fetchLettersUrl = "/.netlify/functions/updateReaction?list=true";
    const fetchSingleLetterUrl = "/.netlify/functions/updateReaction?recordId=";
    const netlifyFunctionUrl = "/.netlify/functions/updateReaction";
    let currentRecordId = null;

    async function fetchLetters() {
      const response = await fetch(fetchLettersUrl);
      const data = await response.json();
      return data.records || [];
    }

    function createLetterHTML(record) {
      const name = record.fields["Display Name"] || "Anonymous";
      const content = record.fields["Letter Content"] || "";
      const preview = content.substring(0, 100) + "...";
      const id = record.id;

      return `
        <div class="letter-preview" data-id="${id}">
          <div class="letter-header">${name}</div>
          <div class="letter-snippet">${preview}</div>
          <button class="read-more" onclick="showFullLetter('${id}')">Read More</button>
        </div>
      `;
    }

    async function incrementViewCount(recordId) {
      return fetch(netlifyFunctionUrl, {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recordId: recordId, field: "View Count" })
      });
    }

    function sendReactionFromModal(field) {
      if (!currentRecordId) return;

      const key = `reaction_${currentRecordId}_${field}`;
      if (localStorage.getItem(key)) {
        alert("You already clicked this reaction.");
        return;
      }

      fetch(netlifyFunctionUrl, {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recordId: currentRecordId, field })
      }).then(() => {
        localStorage.setItem(key, true);
        alert("Thank you for your response.");
      });
    }

    async function showFullLetter(recordId) {
      currentRecordId = recordId;
      const response = await fetch(fetchSingleLetterUrl + recordId);
      const record = await response.json();

      document.getElementById("modal-author").innerText = record.fields["Display Name"] || "Anonymous";
      document.getElementById("modal-letter").value = record.fields["Letter Content"] || "";
      document.getElementById("modal-response").value = record.fields["Moderator Response"] || "";

      document.getElementById("letter-modal").style.display = "block";

      if (!localStorage.getItem(`viewed_${recordId}`)) {
        await incrementViewCount(recordId);
        localStorage.setItem(`viewed_${recordId}`, true);
      }
    }

    function closeModal() {
      document.getElementById("letter-modal").style.display = "none";
    }

    async function renderLetters() {
      const container = document.getElementById("letters-container");
      const records = await fetchLetters();
      container.innerHTML = records.map(createLetterHTML).join("");
    }

    renderLetters();
  </script>
</body>
</html>
