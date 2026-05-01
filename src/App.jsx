import React, { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Play,
  Trash2,
  ArrowLeft,
  RotateCcw,
  ChevronRight,
  ChevronLeft,
  Mic2,
  Save,
  X,
  Edit2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Utility to split text into objects: { speaker, text }
const splitSentences = (text) => {
  if (!text) return [];
  return text
    .split("|||")
    .filter((s) => s.trim())
    .map((s) => {
      const [speaker, ...textParts] = s.split(":");
      return { speaker: speaker || "A", text: textParts.join(":") };
    });
};

const translations = {
  th: {
    title: "Chinese Reader AI",
    subtitle: "ฝึกฟังและอ่านภาษาจีนทีละประโยค",
    addNew: "เพิ่มชุดบทพูดใหม่",
    startReading: "เริ่มอ่าน",
    edit: "แก้ไข",
    delete: "ลบ",
    backToHome: "กลับหน้าหลัก",
    restart: "เริ่มใหม่",
    loadingVoices: "กำลังโหลดเสียง...",
    selectVoice: "เลือกเสียงพูด",
    autoChinese: "อัตโนมัติ (ภาษาจีน)",
    speaker: "คนพูด",
    speakerLabel: "ผู้พูด",
    sentenceNum: "ข้อความประโยคที่",
    addNext: "เพิ่มประโยคถัดไป",
    saveSet: "บันทึกชุดบทพูดทั้งหมด",
    cancel: "ยกเลิก",
    editSet: "แก้ไขชุดบทพูด",
    newSet: "เพิ่มชุดบทพูดใหม่",
    setTitle: "หัวข้อชุดบทพูด",
    setTitlePlaceholder: "เช่น บทเรียนที่ 1...",
    sentenceList: "รายการประโยคและการระบุคนพูด",
    chinesePlaceholder: "พิมพ์ภาษาจีนที่นี่...",
    startListen: "เริ่มฟังบทพูด",
    listenAgain: "ฟังอีกครั้ง",
    speaking: "กำลังพูด...",
    showChinese: "แสดงข้อความภาษาจีน",
    endOfSet: "จบชุดบทพูดแล้ว! 🎉",
    restartAgain: "เริ่มใหม่อีกครั้ง",
    setCount: "ลำดับที่ {current} จาก {total}",
    exampleTitle: "ตัวอย่าง: ภาษาจีนพื้นฐาน",
    exampleContent:
      "你好！很高兴见到你。|||今天天气很好。|||我们要一起学习中文吗？",
  },
  en: {
    title: "Chinese Reader AI",
    subtitle: "Practice listening and reading Chinese sentence by sentence",
    addNew: "Add New Set",
    startReading: "Start Reading",
    edit: "Edit",
    delete: "Delete",
    backToHome: "Back to Home",
    restart: "Restart",
    loadingVoices: "Loading voices...",
    selectVoice: "Select Voice",
    autoChinese: "Auto (Chinese)",
    speaker: "Speaker",
    speakerLabel: "Speaker",
    sentenceNum: "Sentence number",
    addNext: "Add Next Sentence",
    saveSet: "Save All Sentences",
    cancel: "Cancel",
    editSet: "Edit Lesson Set",
    newSet: "Add New Lesson Set",
    setTitle: "Lesson Title",
    setTitlePlaceholder: "e.g., Lesson 1...",
    sentenceList: "Sentences and Speakers",
    chinesePlaceholder: "Type Chinese here...",
    startListen: "Start Listening",
    listenAgain: "Listen Again",
    speaking: "Speaking...",
    showChinese: "Show Chinese Text",
    endOfSet: "End of Set! 🎉",
    restartAgain: "Restart Practice",
    setCount: "Sentence {current} of {total}",
    exampleTitle: "Example: Basic Chinese",
    exampleContent:
      "你好！很高兴见到你。|||今天天气很好。|||我们要一起学习中文吗？",
  },
};

const App = () => {
  const [view, setView] = useState("home"); // home, reader, editor
  const [sets, setSets] = useState([]);
  const [currentSetId, setCurrentSetId] = useState(null);
  const [editingSet, setEditingSet] = useState(null);
  const [lang, setLang] = useState("th");

  const t = translations[lang];

  // Load sets and language from localStorage
  useEffect(() => {
    const savedSets = localStorage.getItem("tts-speech-sets");
    const savedLang = localStorage.getItem("tts-app-lang");

    if (savedLang) setLang(savedLang);

    if (savedSets) {
      setSets(JSON.parse(savedSets));
    } else {
      // Default set for first time users
      const defaultSet = {
        id: Date.now(),
        title: translations.th.exampleTitle,
        content: translations.th.exampleContent,
      };
      setSets([defaultSet]);
      localStorage.setItem("tts-speech-sets", JSON.stringify([defaultSet]));
    }
  }, []);

  const toggleLang = () => {
    const newLang = lang === "th" ? "en" : "th";
    setLang(newLang);
    localStorage.setItem("tts-app-lang", newLang);
  };

  // Save sets to localStorage
  const saveToStorage = (newSets) => {
    setSets(newSets);
    localStorage.setItem("tts-speech-sets", JSON.stringify(newSets));
  };

  const handleDeleteSet = (id, e) => {
    e.stopPropagation();
    const newSets = sets.filter((s) => s.id !== id);
    saveToStorage(newSets);
  };

  const handleStartSet = (set) => {
    setCurrentSetId(set.id);
    setView("reader");
  };

  const handleCreateNew = () => {
    setEditingSet({ title: "", content: "" });
    setView("editor");
  };

  const handleSaveSet = (title, content) => {
    let newSets;
    if (editingSet?.id) {
      newSets = sets.map((s) =>
        s.id === editingSet.id ? { ...s, title, content } : s,
      );
    } else {
      newSets = [...sets, { id: Date.now(), title, content }];
    }
    saveToStorage(newSets);
    setView("home");
    setEditingSet(null);
  };

  const handleEditSet = (set, e) => {
    e.stopPropagation();
    setEditingSet(set);
    setView("editor");
  };

  return (
    <div className="container">
      <AnimatePresence mode="wait">
        {view === "home" && (
          <motion.div
            key="home"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginBottom: "1rem",
              }}
            >
              <button
                className="btn btn-secondary"
                onClick={toggleLang}
                style={{
                  minHeight: "50px",
                  padding: "0.5rem 1.5rem",
                  borderRadius: "15px",
                  fontSize: "1rem",
                  background: "rgba(255,255,255,0.1)",
                  border: "1px solid rgba(255,255,255,0.2)",
                }}
              >
                {lang === "th" ? "🇬🇧 English" : "🇹🇭 ภาษาไทย"}
              </button>
            </div>

            <header
              style={{
                marginBottom: "6rem",
                marginTop: "2rem",
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                gap: "2rem",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                }}
              >
                <h1 style={{ margin: 0, fontSize: "3.5rem" }}>{t.title}</h1>
                <h2
                  style={{
                    margin: 0,
                    fontSize: "1.8rem",
                    color: "rgba(255,255,255,0.7)",
                  }}
                >
                  {t.subtitle}
                </h2>
              </div>
              <button
                className="btn btn-primary"
                onClick={handleCreateNew}
                style={{
                  padding: "1.5rem 3.5rem",
                  fontSize: "1.3rem",
                  borderRadius: "25px",
                }}
              >
                <Plus size={28} /> {t.addNew}
              </button>
            </header>

            <div className="sets-grid">
              {sets.map((set) => (
                <div
                  key={set.id}
                  className="glass-card"
                  onClick={() => handleStartSet(set)}
                  style={{
                    cursor: "pointer",
                    position: "relative",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                    padding: "2.5rem",
                  }}
                >
                  <h3
                    style={{
                      fontSize: "1.5rem",
                      margin: 0,
                      wordBreak: "break-word",
                      overflowWrap: "anywhere",
                      lineHeight: "1.4",
                      display: "-webkit-box",
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                      height: "4.2em" /* Exactly 3 lines (1.4 * 3) */,
                    }}
                  >
                    {set.title}
                  </h3>

                  <div
                    style={{
                      marginTop: "2rem",
                      display: "flex",
                      flexDirection: "column",
                      gap: "1rem",
                    }}
                  >
                    <div
                      style={{
                        color: "#6366f1",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        fontWeight: 700,
                        fontSize: "1.2rem",
                        padding: "0.5rem",
                      }}
                    >
                      <Play size={20} /> {t.startReading}
                    </div>

                    <div style={{ display: "flex", gap: "0.75rem" }}>
                      <button
                        className="btn btn-secondary"
                        style={{ flex: 1, padding: "1rem" }}
                        onClick={(e) => handleEditSet(set, e)}
                      >
                        <Edit2 size={20} /> {t.edit}
                      </button>
                      <button
                        className="btn btn-danger"
                        style={{
                          flex: 1,
                          padding: "1rem",
                          background: "rgba(239, 68, 68, 0.1)",
                          border: "1px solid rgba(239, 68, 68, 0.2)",
                          color: "#f87171",
                        }}
                        onClick={(e) => handleDeleteSet(set.id, e)}
                      >
                        <Trash2 size={20} /> {t.delete}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {view === "editor" && (
          <Editor
            initialData={editingSet}
            onSave={handleSaveSet}
            onBack={() => setView("home")}
            t={t}
          />
        )}

        {view === "reader" && (
          <Reader
            set={sets.find((s) => s.id === currentSetId)}
            onBack={() => setView("home")}
            t={t}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const Editor = ({ initialData, onSave, onBack, t }) => {
  const [title, setTitle] = useState(initialData?.title || "");

  // Parse existing content: "A:text|||B:text"
  const parseContent = (content) => {
    if (!content) return [{ speaker: "A", text: "" }];
    return content.split("|||").map((s) => {
      if (!s.includes(":")) return { speaker: "A", text: s };
      const [speaker, ...textParts] = s.split(":");
      return { speaker: speaker || "A", text: textParts.join(":") };
    });
  };

  const [sentences, setSentences] = useState(
    parseContent(initialData?.content),
  );
  const [isSpeakerPickerOpen, setIsSpeakerPickerOpen] = useState(false);
  const [activeSentenceIndex, setActiveSentenceIndex] = useState(null);

  const handleAddSentence = () => {
    const lastSpeaker = sentences[sentences.length - 1]?.speaker || "A";
    const nextSpeaker = lastSpeaker === "A" ? "B" : "A";
    setSentences([...sentences, { speaker: nextSpeaker, text: "" }]);
  };

  const handleRemoveSentence = (index) => {
    if (sentences.length === 1) return;
    const newSentences = [...sentences];
    newSentences.splice(index, 1);
    setSentences(newSentences);
  };

  const handleFieldChange = (index, field, value) => {
    const newSentences = [...sentences];
    newSentences[index][field] = value;
    setSentences(newSentences);
  };

  const openSpeakerPicker = (index) => {
    setActiveSentenceIndex(index);
    setIsSpeakerPickerOpen(true);
  };

  const selectSpeaker = (speaker) => {
    handleFieldChange(activeSentenceIndex, "speaker", speaker);
    setIsSpeakerPickerOpen(false);
  };

  const handleSave = () => {
    const content = sentences
      .filter((s) => s.text.trim())
      .map((s) => `${s.speaker}:${s.text}`)
      .join("|||");
    onSave(title, content);
  };

  const speakers = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  return (
    <motion.div
      key="editor"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="glass-card"
      style={{ maxWidth: "800px", margin: "0 auto" }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2rem",
        }}
      >
        <h2 style={{ margin: 0, color: "white" }}>
          {initialData?.id ? t.editSet : t.newSet}
        </h2>
        <button className="btn btn-secondary" onClick={onBack}>
          <X size={20} /> {t.cancel}
        </button>
      </div>

      <div style={{ marginBottom: "2rem" }}>
        <label
          style={{
            display: "block",
            marginBottom: "0.5rem",
            fontWeight: 600,
            color: "var(--text-dim)",
          }}
        >
          {t.setTitle}
        </label>
        <input
          placeholder={t.setTitlePlaceholder}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{ marginBottom: 0 }}
        />
      </div>

      <div style={{ marginBottom: "1.5rem" }}>
        <label
          style={{
            display: "block",
            marginBottom: "1rem",
            fontWeight: 600,
            color: "var(--text-dim)",
          }}
        >
          {t.sentenceList}
        </label>

        <div
          style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
        >
          {sentences.map((s, idx) => (
            <motion.div
              layout
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1.5rem",
                background: "rgba(255,255,255,0.03)",
                padding: "2rem",
                borderRadius: "24px",
                border: "1px solid rgba(255, 255, 255, 0.05)",
                boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
              }}
            >
              {/* Speaker Selector (Custom Style) */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                }}
              >
                <label
                  style={{
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    color: "var(--primary)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  {t.speaker}
                </label>
                <button
                  onClick={() => openSpeakerPicker(idx)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "1.25rem 2rem",
                    borderRadius: "20px",
                    fontSize: "1.25rem",
                    fontWeight: "800",
                    background: "rgba(0,0,0,0.4)",
                    border: "2px solid rgba(99, 102, 241, 0.2)",
                    color: "white",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                  className="btn-voice-picker"
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "1rem",
                    }}
                  >
                    <Mic2 size={24} color="var(--primary)" />
                    <span>{s.speaker}</span>
                  </div>
                  <ChevronRight size={24} opacity={0.5} />
                </button>
              </div>

              {/* Text Area */}
              <div
                style={{
                  display: "flex",
                  gap: "1.5rem",
                  alignItems: "flex-end",
                }}
              >
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.75rem",
                  }}
                >
                  <label
                    style={{
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      color: "var(--text-dim)",
                    }}
                  >
                    {t.sentenceNum} {idx + 1}
                  </label>
                  <textarea
                    placeholder={t.chinesePlaceholder}
                    value={s.text}
                    onChange={(e) =>
                      handleFieldChange(idx, "text", e.target.value)
                    }
                    rows={2}
                    style={{
                      marginBottom: 0,
                      padding: "1.5rem",
                      fontSize: "1.25rem",
                      borderRadius: "18px",
                      background: "rgba(0,0,0,0.4)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      lineHeight: "1.6",
                      resize: "none",
                    }}
                  />
                </div>

                <button
                  className="btn btn-danger"
                  style={{
                    padding: "0",
                    borderRadius: "16px",
                    width: "60px",
                    height: "60px",
                    background: "rgba(239, 68, 68, 0.1)",
                    border: "1px solid rgba(239, 68, 68, 0.2)",
                    minHeight: "auto",
                    marginBottom: "4px",
                  }}
                  onClick={() => handleRemoveSentence(idx)}
                  disabled={sentences.length === 1}
                  title={t.delete}
                >
                  <Trash2 size={24} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <button
        className="btn btn-secondary"
        onClick={handleAddSentence}
        style={{
          width: "100%",
          marginBottom: "2.5rem",
          borderStyle: "dashed",
          borderWidth: "2px",
          background: "rgba(255,255,255,0.02)",
          padding: "1.5rem",
          fontSize: "1.1rem",
        }}
      >
        <Plus size={24} /> {t.addNext}
      </button>

      <div style={{ display: "flex", gap: "1.5rem" }}>
        <button
          className="btn btn-primary"
          disabled={!title || sentences.every((s) => !s.text.trim())}
          onClick={handleSave}
          style={{
            flex: 1,
            padding: "1.5rem",
            fontSize: "1.25rem",
            borderRadius: "24px",
          }}
        >
          <Save size={24} /> {t.saveSet}
        </button>
      </div>

      {/* Speaker Picker Modal */}
      <AnimatePresence>
        {isSpeakerPickerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0,0,0,0.85)",
              backdropFilter: "blur(10px)",
              zIndex: 2000,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "2rem",
            }}
            onClick={() => setIsSpeakerPickerOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="glass-card"
              style={{
                width: "100%",
                maxWidth: "500px",
                maxHeight: "70vh",
                overflowY: "auto",
                padding: "2rem",
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: "1rem",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  gridColumn: "span 4",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "1rem",
                }}
              >
                <h3 style={{ margin: 0 }}>{t.speaker}</h3>
                <button
                  className="btn btn-secondary"
                  style={{ minHeight: "auto", padding: "0.5rem" }}
                  onClick={() => setIsSpeakerPickerOpen(false)}
                >
                  <X size={24} />
                </button>
              </div>

              {speakers.map((char) => (
                <button
                  key={char}
                  onClick={() => selectSpeaker(char)}
                  className={`btn ${sentences[activeSentenceIndex]?.speaker === char ? "btn-primary" : "btn-secondary"}`}
                  style={{
                    padding: "1.5rem",
                    fontSize: "1.5rem",
                    fontWeight: 900,
                    aspectRatio: "1/1",
                    borderRadius: "15px",
                  }}
                >
                  {char}
                </button>
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const Reader = ({ set, onBack, t }) => {
  const sentences = useMemo(() => splitSentences(set.content), [set.content]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [selectedVoiceName, setSelectedVoiceName] = useState("");
  const [showText, setShowText] = useState(false);
  const [isVoicePickerOpen, setIsVoicePickerOpen] = useState(false);

  const [voices, setVoices] = useState([]);

  // Load voices
  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);

      if (!selectedVoiceName) {
        const zhVoice = availableVoices.find(
          (v) => v.lang.includes("zh") || v.lang.includes("CN"),
        );
        if (zhVoice) setSelectedVoiceName(zhVoice.name);
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, [selectedVoiceName]);

  const speak = (index) => {
    if (!sentences[index]) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(sentences[index].text);

    let voice = voices.find((v) => v.name === selectedVoiceName);
    if (!voice) {
      voice = voices.find(
        (v) => v.lang.includes("zh") || v.lang.includes("CN"),
      );
    }

    if (voice) {
      utterance.voice = voice;
    }

    utterance.lang = "zh-CN";
    utterance.rate = 0.9;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  // Reset showText when index changes
  useEffect(() => {
    setShowText(false);
  }, [currentIndex]);

  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    if (voices.length > 0 && hasInteracted) {
      speak(currentIndex);
    }
    return () => window.speechSynthesis.cancel();
  }, [currentIndex, voices, hasInteracted]);

  useEffect(() => {
    const handleFirstInteraction = () => {
      setHasInteracted(true);
      window.removeEventListener("mousedown", handleFirstInteraction);
    };
    window.addEventListener("mousedown", handleFirstInteraction);
    return () =>
      window.removeEventListener("mousedown", handleFirstInteraction);
  }, []);

  const handleNext = () => {
    if (currentIndex < sentences.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const [hasStartedSet, setHasStartedSet] = useState(false);

  // Reset state when restarting
  const handleRestart = () => {
    setCurrentIndex(0);
    setHasStartedSet(false);
    setShowText(false);
  };

  // Handle Main Button Click
  const handleMainButtonClick = () => {
    if (!hasStartedSet) setHasStartedSet(true);
    speak(currentIndex);
  };

  const progress = ((currentIndex + 1) / sentences.length) * 100;
  const currentSentence = sentences[currentIndex];

  // Button Style logic
  const isInitialStart = currentIndex === 0 && !hasStartedSet;
  const mainButtonText = isInitialStart
    ? t.startListen
    : isSpeaking
      ? t.speaking
      : t.listenAgain;
  const mainButtonColor = isInitialStart
    ? "linear-gradient(135deg, #10b981, #059669)" // Green for Start
    : "linear-gradient(135deg, #6366f1, #8b5cf6)"; // Blue/Purple for Repeat

  return (
    <motion.div
      key="reader"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
    >
      <button
        className="btn btn-secondary"
        onClick={onBack}
        style={{ marginBottom: "2rem" }}
      >
        <ArrowLeft size={20} /> {t.backToHome}
      </button>

      <div className="glass-card">
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "2rem",
            marginBottom: "2.5rem",
            paddingBottom: "2rem",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ flex: 1 }}>
              <h3
                style={{
                  margin: 0,
                  fontSize: "1.8rem",
                  fontWeight: 800,
                  wordBreak: "break-word",
                  overflowWrap: "anywhere",
                }}
              >
                {set.title}
              </h3>
              <p
                style={{
                  color: "var(--text-dim)",
                  fontSize: "1.1rem",
                  marginTop: "0.5rem",
                }}
              >
                {t.setCount
                  .replace("{current}", currentIndex + 1)
                  .replace("{total}", sentences.length)}
              </p>
            </div>
            <button
              className="btn btn-secondary"
              style={{ width: "60px", height: "60px", borderRadius: "50%" }}
              onClick={handleRestart}
              title={t.restart}
            >
              <RotateCcw size={24} />
            </button>
          </div>

          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
            <div style={{ flex: 1 }}>
              {voices.length === 0 ? (
                <div
                  style={{
                    padding: "1.25rem 2rem",
                    background: "rgba(0,0,0,0.3)",
                    borderRadius: "20px",
                    color: "#ec4899",
                  }}
                >
                  {t.loadingVoices}
                </div>
              ) : (
                <button
                  className="btn btn-secondary"
                  onClick={() => setIsVoicePickerOpen(true)}
                  style={{
                    width: "100%",
                    justifyContent: "space-between",
                    padding: "1.25rem 2rem",
                    borderRadius: "20px",
                    fontSize: "1.1rem",
                    background: "rgba(0,0,0,0.4)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "1rem",
                    }}
                  >
                    <Mic2 size={24} color="var(--primary)" />
                    <span
                      style={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        maxWidth: "250px",
                      }}
                    >
                      {selectedVoiceName || t.autoChinese}
                    </span>
                  </div>
                  <ChevronRight size={24} opacity={0.5} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Voice Picker Overlay */}
        <AnimatePresence>
          {isVoicePickerOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: "rgba(0,0,0,0.85)",
                backdropFilter: "blur(10px)",
                zIndex: 1000,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "2rem",
              }}
              onClick={() => setIsVoicePickerOpen(false)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="glass-card"
                style={{
                  width: "100%",
                  maxWidth: "600px",
                  maxHeight: "80vh",
                  overflowY: "auto",
                  padding: "2rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "1rem",
                  }}
                >
                  <h3 style={{ margin: 0 }}>{t.selectVoice}</h3>
                  <button
                    className="btn btn-secondary"
                    style={{ minHeight: "auto", padding: "0.5rem" }}
                    onClick={() => setIsVoicePickerOpen(false)}
                  >
                    <X size={24} />
                  </button>
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.75rem",
                  }}
                >
                  <button
                    className={`btn ${!selectedVoiceName ? "btn-primary" : "btn-secondary"}`}
                    style={{ justifyContent: "flex-start", padding: "1.5rem" }}
                    onClick={() => {
                      setSelectedVoiceName("");
                      setIsVoicePickerOpen(false);
                    }}
                  >
                    {t.autoChinese}
                  </button>

                  {(voices.some(
                    (v) => v.lang.includes("zh") || v.lang.includes("CN"),
                  )
                    ? voices.filter(
                        (v) => v.lang.includes("zh") || v.lang.includes("CN"),
                      )
                    : voices
                  ).map((v) => (
                    <button
                      key={v.name}
                      className={`btn ${selectedVoiceName === v.name ? "btn-primary" : "btn-secondary"}`}
                      style={{
                        justifyContent: "flex-start",
                        padding: "1.5rem",
                        textAlign: "left",
                      }}
                      onClick={() => {
                        setSelectedVoiceName(v.name);
                        setIsVoicePickerOpen(false);
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "flex-start",
                        }}
                      >
                        <span style={{ fontWeight: 700 }}>{v.name}</span>
                        <span style={{ fontSize: "0.8rem", opacity: 0.6 }}>
                          {v.lang}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div
          className="progress-bar"
          style={{
            height: "8px",
            borderRadius: "4px",
            background: "rgba(255,255,255,0.05)",
          }}
        >
          <div
            className="progress-inner"
            style={{
              width: `${progress}%`,
              borderRadius: "4px",
              boxShadow: "0 0 15px var(--primary)",
            }}
          ></div>
        </div>

        <div
          className="sentence-container"
          style={{ flexDirection: "column", gap: "3rem" }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "2rem",
              }}
            >
              {/* Speaker Indicator */}
              <div
                style={{
                  width: "180px",
                  height: "180px",
                  borderRadius: "50%",
                  background:
                    "linear-gradient(135deg, var(--primary), var(--accent))",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "5rem",
                  fontWeight: "900",
                  boxShadow: "0 15px 40px rgba(99, 102, 241, 0.4)",
                  color: "white",
                  border: "8px solid rgba(255, 255, 255, 0.1)",
                }}
              >
                {currentSentence.speaker}
              </div>

              <div
                style={{
                  color: "white",
                  fontSize: "1.5rem",
                  fontWeight: 600,
                  opacity: 0.8,
                }}
              >
                {t.speakerLabel} {currentSentence.speaker}
              </div>

              {/* Revealable Text */}
              <div
                style={{
                  minHeight: "120px",
                  display: "flex",
                  alignItems: "center",
                  width: "100%",
                  justifyContent: "center",
                }}
              >
                {showText ? (
                  <motion.div
                    initial={{ opacity: 0, filter: "blur(10px)" }}
                    animate={{ opacity: 1, filter: "blur(0px)" }}
                    className="sentence-text"
                  >
                    {currentSentence.text}
                  </motion.div>
                ) : (
                  <button
                    className="btn btn-secondary"
                    onClick={() => setShowText(true)}
                    style={{
                      padding: "1.5rem 3rem",
                      fontSize: "1.2rem",
                      borderRadius: "25px",
                      opacity: 0.8,
                    }}
                  >
                    {t.showChinese}
                  </button>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="controls" style={{ gap: "1.5rem" }}>
          <button
            className="btn btn-secondary"
            style={{ borderRadius: "25px", width: "80px" }}
            onClick={handlePrev}
            disabled={currentIndex === 0}
          >
            <ChevronLeft size={32} />
          </button>

          <button
            className="btn btn-primary"
            style={{
              padding: "1.5rem 4rem",
              fontSize: "1.5rem",
              borderRadius: "30px",
              flex: 1,
              maxWidth: "400px",
              background: mainButtonColor,
              boxShadow: isInitialStart
                ? "0 10px 30px rgba(16, 185, 129, 0.3)"
                : "0 10px 30px rgba(99, 102, 241, 0.3)",
            }}
            onClick={handleMainButtonClick}
          >
            <Mic2 size={32} /> {mainButtonText}
          </button>

          <button
            className="btn btn-secondary"
            style={{ borderRadius: "25px", width: "80px" }}
            onClick={handleNext}
            disabled={currentIndex === sentences.length - 1}
          >
            <ChevronRight size={32} />
          </button>
        </div>

        {currentIndex === sentences.length - 1 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              textAlign: "center",
              marginTop: "3rem",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "1.5rem",
            }}
          >
            <div
              style={{ color: "#ec4899", fontWeight: 600, fontSize: "1.4rem" }}
            >
              {t.endOfSet}
            </div>
            <button
              className="btn btn-primary"
              onClick={handleRestart}
              style={{
                background: "linear-gradient(135deg, #ec4899, #8b5cf6)",
                padding: "1rem 3rem",
              }}
            >
              <RotateCcw size={20} /> เริ่มใหม่อีกครั้ง
            </button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default App;
