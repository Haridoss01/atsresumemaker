const checkBtn = document.getElementById("check-btn");
const pdfInput = document.getElementById("pdf-input");
let waringText = document.getElementById("warning-text");

let pdfText = "";

function provideResult(score, matched, missing, sectionWarnings) {
    let outputCont = document.querySelector(".output-cont");
    outputCont.classList.remove("out-dis");

    document.querySelector(".score-text").innerText = `${score}%`;
    document.querySelector(".matched").innerText = `${matched.length ? matched.join(", ") : "None"}`;
    document.querySelector(".missing").innerText = `${missing.length ? missing.join(", ") : "None"}`;
    document.querySelector(".sw").innerText = `${sectionWarnings.length ? sectionWarnings.join("<br>") : "No issues found"}`;
};

pdfInput.addEventListener("change", (e) => {
    let inputText = document.getElementById("input-text");
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.readAsArrayBuffer(file);
    reader.onload = async () => {
        const typedFileArray = new Uint8Array(reader.result);
        const pdf = await pdfjsLib.getDocument(typedFileArray).promise;
        let fullText = "";
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            const pageContent = content.items.map(items => items.str.toLowerCase()).join(" ");
            fullText += `\n\n--------page${i}------\n${pageContent}`;
        };
        inputText.value = fullText;
        pdfText = fullText;
    };
});

checkBtn.addEventListener("click", () => {
    waringText.innerText = "";
    let inputText = document.getElementById("input-text").value.toLowerCase();
    let resumeText = pdfText || inputText;
    let jdText = document.getElementById("jd-text").value.toLowerCase();
    if (!resumeText || !jdText) {
        waringText.innerText = "*Paste Both (Resume Text or Select Pdf) and Job Description";
        return;
    }

    const stopWords = [
        // Articles & connectors
        "a", "an", "the", "and", "or", "but", "if", "while", "with", "without", "to", "from", "of",
        "in", "on", "at", "by", "for", "as", "into", "over", "under", "between", "among",

        // Pronouns
        "i", "me", "my", "mine", "we", "our", "ours", "you", "your", "yours", "they", "their",

        // Common verbs
        "is", "are", "was", "were", "be", "been", "being", "have", "has", "had", "do", "does", "did",
        "make", "made", "use", "used", "using", "work", "worked", "working",

        // HR / JD filler
        "responsibilities", "requirements", "qualification", "qualifications",
        "role", "position", "candidate", "job", "opening", "opportunity",
        "looking", "seeking", "hiring",

        // Resume fluff
        "experience", "experienced", "skills", "skill", "knowledge", "ability",
        "strong", "good", "excellent", "proven", "hands", "hands-on",

        // Time & level
        "years", "year", "months", "month", "junior", "senior", "mid", "level",

        // Soft skills (low ATS weight)
        "team", "teamwork", "collaboration", "communicate", "communication",
        "problem", "problem-solving", "motivated", "passionate", "self",

        // Education fillers
        "degree", "bachelor", "master", "education", "university", "college",

        // Generic tech words
        "technology", "technologies", "tools", "tool", "software", "system", "systems"
    ];

    let jdWords = jdText.match(/\b[a-z]{3,}\b/g) || [];

    let filteredJdWords = jdWords.filter(eachWords => !stopWords.includes(eachWords));
    let keyWords = [...new Set(filteredJdWords)];

    let matched = [];
    let missing = [];

    keyWords.forEach(word => {
        if (resumeText.includes(word)) {
            matched.push(word);
        } else {
            missing.push(word);
        }
    });

    //ATS Score
    let score = Math.min(Math.round((matched.length / missing.length) * 100), 100);
    if (isNaN(score)) score = 0;

    //ATS Section 
    const sections = ["skills", "experience", "projects", "education"];
    let sectionWarnings = [];

    sections.forEach(section => {
        if (!resumeText.includes(section)) {
            sectionWarnings.push(`Missing section: ${section}`);
        }
    });
    provideResult(score, matched, missing, sectionWarnings);
});