import React, { useState, useEffect, useMemo, useRef } from "react";
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
  LogIn,
  LogOut,
  Download,
  Upload,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "./supabaseClient";

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

const hasChinese = (text) => /[\u4e00-\u9fa5]/.test(text);

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
    showChinese: "แสดงข้อความ",
    hideChinese: "ซ่อนข้อความ",
    endOfSet: "จบชุดบทพูดแล้ว! 🎉",
    restartAgain: "เริ่มใหม่อีกครั้ง",
    setCount: "ลำดับที่ {current} จาก {total}",
    exampleTitle: "ตัวอย่าง: ภาษาจีนพื้นฐาน",
    exampleContent:
      "你好！很高兴见到你。|||今天天气很好。|||我们要一起学习中文吗？",
    noChineseVoice: "⚠️ ไม่พบเสียงภาษาจีนในเครื่อง",
    voiceWarning:
      "โปรดติดตั้ง 'Chinese Language Pack' ในตั้งค่าของเครื่องเพื่อเสียงที่ถูกต้อง",
    confirmDelete: "ยืนยันการลบ",
    confirmDeleteMsg:
      "คุณแน่ใจหรือไม่ว่าต้องการลบชุดบทเรียนนี้? การกระทำนี้ไม่สามารถย้อนกลับได้",
    confirm: "ลบเลย",
    loginWithGoogle: "เข้าสู่ระบบด้วย Google",
    logout: "ออกจากระบบ",
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
    showChinese: "Show Text",
    hideChinese: "Hide Text",
    endOfSet: "End of Set! 🎉",
    restartAgain: "Restart Practice",
    setCount: "Sentence {current} of {total}",
    exampleTitle: "Example: Basic Chinese",
    exampleContent:
      "你好！很高兴见到你。|||今天天气很好。|||我们要一起学习中文吗？",
    noChineseVoice: "⚠️ No Chinese voice found",
    voiceWarning:
      "Please install 'Chinese Language Pack' in system settings for correct pronunciation.",
    confirmDelete: "Confirm Delete",
    confirmDeleteMsg:
      "Are you sure you want to delete this lesson set? This action cannot be undone.",
    confirm: "Delete",
    loginWithGoogle: "Login with Google",
    logout: "Logout",
  },
};

const App = () => {
  const [view, setView] = useState("home"); // home, reader, editor
  const [sets, setSets] = useState([]);
  const [currentSetId, setCurrentSetId] = useState(null);
  const [editingSet, setEditingSet] = useState(null);
  const [lang, setLang] = useState("th");
  const [isLangPickerOpen, setIsLangPickerOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [setToDeleteId, setSetToDeleteId] = useState(null);
  const [user, setUser] = useState(null);

  const t = translations[lang];

  // Auth State
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // Load sets from Supabase or localStorage
  const loadSets = async () => {
    if (user) {
      const { data, error } = await supabase
        .from("lesson_sets")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) {
        const mappedData = data.map((s) => ({
          id: s.id,
          title: s.title,
          content: s.content,
          isCloud: true,
        }));
        setSets(mappedData);
        return;
      }
    }

    const savedSets = localStorage.getItem("tts-speech-sets");
    if (savedSets) {
      setSets(JSON.parse(savedSets));
    } else {
      const defaultSet = {
        id: Date.now(),
        title: translations[lang].exampleTitle,
        content: translations[lang].exampleContent,
      };
      setSets([defaultSet]);
    }
  };

  useEffect(() => {
    loadSets();
  }, [user]);

  // Load language from localStorage
  useEffect(() => {
    const savedLang = localStorage.getItem("tts-app-lang");
    if (savedLang) {
      setLang(savedLang);
    } else {
      const browserLang = navigator.language || navigator.userLanguage || "en";
      const initialLang = browserLang.toLowerCase().startsWith("th")
        ? "th"
        : "en";
      setLang(initialLang);
      localStorage.setItem("tts-app-lang", initialLang);
    }
  }, []);

  const selectLang = (newLang) => {
    setLang(newLang);
    localStorage.setItem("tts-app-lang", newLang);
    setIsLangPickerOpen(false);
  };

  const handleToggleLang = () => {
    setIsLangPickerOpen(true);
  };

  const saveToStorage = (newSets) => {
    setSets(newSets);
    localStorage.setItem("tts-speech-sets", JSON.stringify(newSets));
  };

  const handleDeleteSet = (id) => {
    setSetToDeleteId(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    const setToDelete = sets.find((s) => s.id === setToDeleteId);
    if (user && setToDelete?.isCloud) {
      await supabase.from("lesson_sets").delete().eq("id", setToDeleteId);
      await loadSets();
    } else {
      const newSets = sets.filter((s) => s.id !== setToDeleteId);
      saveToStorage(newSets);
    }
    setIsDeleteModalOpen(false);
    setSetToDeleteId(null);
  };

  const handleStartReading = (id) => {
    setCurrentSetId(id);
    setView("reader");
  };

  const handleSaveSet = async (title, content) => {
    if (user) {
      if (editingSet?.id && editingSet.isCloud) {
        await supabase
          .from("lesson_sets")
          .update({ title, content })
          .eq("id", editingSet.id);
      } else {
        await supabase
          .from("lesson_sets")
          .insert([{ title, content, user_id: user.id }]);
      }
      await loadSets();
    } else {
      let newSets;
      if (editingSet?.id) {
        newSets = sets.map((s) =>
          s.id === editingSet.id ? { ...s, title, content } : s,
        );
      } else {
        newSets = [...sets, { id: Date.now(), title, content }];
      }
      saveToStorage(newSets);
    }
    setView("home");
    setEditingSet(null);
  };

  const handleExport = () => {
    const exportData = sets.map((s) => ({
      title: s.title,
      content: s.content,
    }));
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `speaker-backup-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const importedSets = JSON.parse(event.target.result);
        if (!Array.isArray(importedSets)) throw new Error("Invalid format");

        const validatedSets = importedSets.filter((s) => s.title && s.content);

        if (user) {
          const insertData = validatedSets.map((s) => ({
            title: s.title,
            content: s.content,
            user_id: user.id,
          }));
          await supabase.from("lesson_sets").insert(insertData);
          await loadSets();
        } else {
          const newSets = [
            ...sets,
            ...validatedSets.map((s) => ({
              ...s,
              id: Date.now() + Math.random(),
            })),
          ];
          saveToStorage(newSets);
        }
        alert(lang === "th" ? "นำเข้าข้อมูลสำเร็จ!" : "Imported successfully!");
      } catch (err) {
        alert(
          (lang === "th" ? "เกิดข้อผิดพลาด: " : "Error: ") + (err.message || "")
        );
      }
    };
    reader.readAsText(file);
    e.target.value = null;
  };

  return (
    <div
      className="container"
      style={{
        padding: "1rem 2rem",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <AnimatePresence mode="wait">
        {view === "home" && (
          <motion.div
            key="home"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ display: "flex", flexDirection: "column", height: "100%" }}
          >
            <div className="main-header">
              {/* Left Side: Data Management (Backup/Import) */}
              <div className="header-group data-group">
                <button
                  className="btn btn-secondary"
                  onClick={handleExport}
                  style={{
                    fontSize: "0.85rem",
                    padding: "0.5rem 1rem",
                    gap: "0.5rem",
                    minHeight: "auto",
                    borderRadius: "12px",
                    background: "rgba(255,255,255,0.05)",
                  }}
                  title={lang === "th" ? "สำรองข้อมูล" : "Backup"}
                >
                  <Download size={16} />
                  <span style={{ fontWeight: 600 }}>
                    {lang === "th" ? "สำรอง" : "Backup"}
                  </span>
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => document.getElementById("import-input").click()}
                  style={{
                    fontSize: "0.85rem",
                    padding: "0.5rem 1rem",
                    gap: "0.5rem",
                    minHeight: "auto",
                    borderRadius: "12px",
                    background: "rgba(255,255,255,0.05)",
                  }}
                  title={lang === "th" ? "นำเข้าข้อมูล" : "Import"}
                >
                  <Upload size={16} />
                  <span style={{ fontWeight: 600 }}>
                    {lang === "th" ? "นำเข้า" : "Import"}
                  </span>
                </button>
                <input
                  id="import-input"
                  type="file"
                  accept=".json"
                  style={{ display: "none" }}
                  onChange={handleImport}
                />
              </div>

              {/* Right Side: Language & Auth */}
              <div className="header-group user-group">
                {/* Language Toggle */}
                <button
                  className="btn btn-secondary"
                  onClick={() => setIsLangPickerOpen(true)}
                  style={{
                    minHeight: "auto",
                    padding: "0.5rem 1rem",
                    borderRadius: "12px",
                    fontSize: "0.85rem",
                    background: "rgba(255,255,255,0.05)",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <div
                    style={{
                      width: "20px",
                      height: "20px",
                      borderRadius: "50%",
                      background: "var(--primary)",
                      color: "white",
                      fontSize: "10px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 800,
                    }}
                  >
                    {lang.toUpperCase()}
                  </div>
                  <span style={{ fontWeight: 600 }}>
                    {lang === "th" ? "ภาษาไทย" : "English"}
                  </span>
                </button>

                {/* Auth Section */}
                {!user ? (
                  <button
                    className="btn btn-secondary"
                    onClick={handleGoogleLogin}
                    style={{
                      minHeight: "auto",
                      padding: "0.5rem 1rem",
                      borderRadius: "12px",
                      fontSize: "0.85rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      background: "rgba(255,255,255,0.05)",
                    }}
                  >
                    <LogIn size={16} />
                    {t.loginWithGoogle}
                  </button>
                ) : (
                  <div
                    style={{ display: "flex", alignItems: "center", gap: "1rem" }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                      }}
                    >
                      <div
                        style={{
                          width: "30px",
                          height: "30px",
                          borderRadius: "50%",
                          background: "var(--primary)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          overflow: "hidden",
                          position: "relative",
                          border: "1px solid rgba(255,255,255,0.1)",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "0.8rem",
                            fontWeight: 700,
                            color: "white",
                          }}
                        >
                          {user.user_metadata.full_name?.charAt(0) || "U"}
                        </span>
                        <img
                          src={user.user_metadata.avatar_url}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            position: "absolute",
                            top: 0,
                            left: 0,
                            transition: "opacity 0.2s",
                          }}
                          alt="avatar"
                          onError={(e) => {
                            e.target.style.opacity = "0";
                          }}
                        />
                      </div>
                      <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>
                        {user.user_metadata.full_name}
                      </span>
                    </div>
                    <button
                      className="btn btn-secondary"
                      onClick={handleLogout}
                      style={{
                        minHeight: "auto",
                        padding: "0.5rem 1rem",
                        borderRadius: "12px",
                        fontSize: "0.85rem",
                        background: "rgba(255,255,255,0.05)",
                      }}
                    >
                      <LogOut size={16} style={{ marginRight: "0.4rem" }} />
                      {t.logout}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Modals */}
            <AnimatePresence>
              {isLangPickerOpen && (
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
                    background: "rgba(0,0,0,0.8)",
                    backdropFilter: "blur(10px)",
                    zIndex: 2000,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "2rem",
                  }}
                  onClick={() => setIsLangPickerOpen(false)}
                >
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="glass-card"
                    style={{
                      width: "100%",
                      maxWidth: "400px",
                      padding: "1.5rem",
                      display: "flex",
                      flexDirection: "column",
                      gap: "1rem",
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <h3 style={{ margin: 0, textAlign: "center" }}>
                      Select Language
                    </h3>
                    <button
                      className={`btn ${lang === "th" ? "btn-primary" : "btn-secondary"}`}
                      onClick={() => {
                        setLang("th");
                        localStorage.setItem("tts-app-lang", "th");
                        setIsLangPickerOpen(false);
                      }}
                      style={{
                        justifyContent: "flex-start",
                        gap: "1rem",
                        padding: "1rem",
                      }}
                    >
                      <div
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "50%",
                          background: "#fff",
                          color: "#000",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 800,
                        }}
                      >
                        TH
                      </div>
                      <span style={{ fontWeight: 700 }}>ภาษาไทย</span>
                    </button>
                    <button
                      className={`btn ${lang === "en" ? "btn-primary" : "btn-secondary"}`}
                      onClick={() => {
                        setLang("en");
                        localStorage.setItem("tts-app-lang", "en");
                        setIsLangPickerOpen(false);
                      }}
                      style={{
                        justifyContent: "flex-start",
                        gap: "1rem",
                        padding: "1rem",
                      }}
                    >
                      <div
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "50%",
                          background: "#fff",
                          color: "#000",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 800,
                        }}
                      >
                        EN
                      </div>
                      <span style={{ fontWeight: 700 }}>English</span>
                    </button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            <header
              style={{
                marginBottom: "2rem",
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.25rem",
                }}
              >
                <h1 style={{ margin: 0, fontSize: "2.5rem" }}>{t.title}</h1>
                <h2
                  style={{
                    margin: 0,
                    fontSize: "1rem",
                    fontWeight: 400,
                    color: "var(--text-dim)",
                  }}
                >
                  {t.subtitle}
                </h2>
              </div>
            </header>

            {/* Scrollable Content Area */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                paddingRight: "0.5rem",
                marginBottom: "1rem",
              }}
              className="custom-scrollbar"
            >

              <div className="sets-grid">
                {/* Add New Card */}
                <motion.div
                  whileHover={{
                    backgroundColor: "rgba(37, 99, 235, 0.05)",
                    borderColor: "var(--primary)",
                    boxShadow: "0 0 20px rgba(37, 99, 235, 0.2)",
                  }}
                  transition={{ duration: 0.05, ease: "easeOut" }}
                  whileTap={{ scale: 0.98 }}
                  className="glass-card"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "1rem",
                    cursor: "pointer",
                    border: "2px dashed rgba(255,255,255,0.1)",
                    background: "rgba(255,255,255,0.02)",
                    minHeight: "220px",
                  }}
                  onClick={() => {
                    setEditingSet({ title: "", content: "" });
                    setView("editor");
                  }}
                >
                  <div
                    style={{
                      width: "60px",
                      height: "60px",
                      borderRadius: "50%",
                      background: "rgba(37, 99, 235, 0.1)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--primary)",
                    }}
                  >
                    <Plus size={32} />
                  </div>
                  <span style={{ fontWeight: 600, fontSize: "1.2rem" }}>
                    {t.addNew}
                  </span>
                </motion.div>

                {sets.map((set) => (
                  <motion.div
                    key={set.id}
                    className="lesson-card glass-card"
                    whileHover={{
                      backgroundColor: "rgba(37, 99, 235, 0.08)",
                      borderColor: "var(--primary)",
                      boxShadow: "0 0 20px rgba(37, 99, 235, 0.2)",
                    }}
                    transition={{ duration: 0.05, ease: "easeOut" }}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "1.5rem",
                      minHeight: "220px",
                      padding: "1.75rem",
                      cursor: "pointer",
                    }}
                    onClick={() => {
                      setCurrentSetId(set.id);
                      setView("reader");
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <h3
                        style={{
                          margin: 0,
                          fontSize: "1.4rem",
                          lineHeight: "1.4",
                          display: "-webkit-box",
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                          height: "4.2em",
                        }}
                      >
                        {set.title}
                      </h3>
                    </div>

                    <div style={{ display: "flex", gap: "0.75rem" }}>
                      <button
                        className="btn btn-primary"
                        style={{ flex: 1, minHeight: "50px", padding: 0 }}
                        onClick={() => {
                          setCurrentSetId(set.id);
                          setView("reader");
                        }}
                        title={t.startReading}
                      >
                        <Play size={24} />
                      </button>
                      <button
                        className="btn btn-secondary"
                        style={{ width: "50px", minHeight: "50px", padding: 0 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingSet(set);
                          setView("editor");
                        }}
                        title={t.edit}
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        className="btn btn-secondary"
                        style={{
                          width: "50px",
                          minHeight: "50px",
                          padding: 0,
                          color: "#ef4444",
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSet(set.id);
                        }}
                        title={t.delete}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {view === "reader" && currentSetId && (
          <Reader
            set={sets.find((s) => s.id === currentSetId)}
            onBack={() => {
              setView("home");
              setCurrentSetId(null);
            }}
            t={t}
          />
        )}

        {view === "editor" && (
          <Editor
            initialData={editingSet}
            onBack={() => {
              setView("home");
              setEditingSet(null);
            }}
            onSave={handleSaveSet}
            t={t}
            lang={lang}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isDeleteModalOpen && (
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
              backdropFilter: "blur(15px)",
              zIndex: 5000,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "2rem",
            }}
            onClick={() => setIsDeleteModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="glass-card"
              style={{
                width: "100%",
                maxWidth: "400px",
                padding: "2.5rem",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                gap: "1.5rem",
                border: "1px solid rgba(239, 68, 68, 0.2)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  width: "80px",
                  height: "80px",
                  borderRadius: "50%",
                  background: "rgba(239, 68, 68, 0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ef4444",
                  marginBottom: "0.5rem",
                }}
              >
                <Trash2 size={40} />
              </div>

              <div>
                <h3
                  style={{
                    margin: "0 0 0.75rem 0",
                    fontSize: "1.5rem",
                    color: "white",
                  }}
                >
                  {t.confirmDelete}
                </h3>
                <p
                  style={{
                    margin: 0,
                    color: "var(--text-dim)",
                    lineHeight: "1.6",
                  }}
                >
                  {t.confirmDeleteMsg}
                </p>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "1rem",
                  width: "100%",
                  marginTop: "1rem",
                }}
              >
                <button
                  className="btn btn-secondary"
                  style={{ flex: 1, minHeight: "55px" }}
                  onClick={() => setIsDeleteModalOpen(false)}
                >
                  {t.cancel}
                </button>
                <button
                  className="btn"
                  style={{
                    flex: 1,
                    minHeight: "55px",
                    background: "#ef4444",
                    color: "white",
                    fontWeight: 700,
                  }}
                  onClick={confirmDelete}
                >
                  {t.confirm}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Editor = ({ initialData, onSave, onBack, t, lang }) => {
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
  const [movingIndex, setMovingIndex] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (movingIndex !== null && scrollRef.current) {
      // 30ms is fast enough for "spamming" but long enough for layout
      const timeoutId = setTimeout(() => {
        const container = scrollRef.current;
        const cardElement = container?.querySelector(
          `[data-index="${movingIndex}"]`,
        );

        if (cardElement && container) {
          const containerRect = container.getBoundingClientRect();
          const cardRect = cardElement.getBoundingClientRect();

          const relativeTop =
            cardRect.top - containerRect.top + container.scrollTop;
          const targetScroll =
            relativeTop - containerRect.height / 2 + cardRect.height / 2;

          container.scrollTo({
            top: targetScroll,
            behavior: "smooth",
          });
        }
      }, 30);
      return () => clearTimeout(timeoutId);
    }
  }, [movingIndex]);

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

  const moveSentence = (index, direction) => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= sentences.length) return;

    const newSentences = [...sentences];
    const temp = newSentences[index];
    newSentences[index] = newSentences[newIndex];
    newSentences[newIndex] = temp;

    setMovingIndex(newIndex);
    setSentences(newSentences);

    setTimeout(() => setMovingIndex(null), 500); // Reduced for better spamming feel
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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="glass-card editor-container"
      style={{
        maxWidth: "100%",
        margin: "0",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        padding: "2rem",
      }}
    >
      {/* Header - Fixed */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.5rem",
        }}
      >
        <h2 style={{ margin: 0, color: "white", fontSize: "1.8rem" }}>
          {initialData?.id ? t.editSet : t.newSet}
        </h2>
        <button
          className="btn btn-secondary"
          onClick={onBack}
          style={{ minHeight: "45px", padding: "0 1rem" }}
        >
          <X size={20} /> {t.cancel}
        </button>
      </div>

      {/* Scrollable Content Area */}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "1rem 1.5rem",
          margin: "0 -1.5rem 0 -1.5rem",
        }}
        className="custom-scrollbar"
      >
        {/* Title Input */}
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

        {/* Sentences List */}
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
                data-index={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: movingIndex === idx ? 1.02 : 1,
                  zIndex: movingIndex === idx ? 10 : 1,
                  borderColor:
                    movingIndex === idx
                      ? "rgba(37, 99, 235, 1)"
                      : "rgba(255, 255, 255, 0.05)",
                  backgroundColor:
                    movingIndex === idx
                      ? "rgba(37, 99, 235, 0.15)"
                      : "rgba(255, 255, 255, 0.03)",
                }}
                transition={{
                  layout: { type: "spring", stiffness: 500, damping: 40 },
                  scale: { duration: 0.15, ease: "easeOut" },
                  borderColor: { duration: 0.15 },
                  backgroundColor: { duration: 0.15 },
                }}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1.5rem",
                  backgroundColor: "rgba(255,255,255,0.03)",
                  padding: "1.5rem",
                  borderRadius: "24px",
                  border: "1px solid rgba(255, 255, 255, 0.05)",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                }}
              >
                {/* Speaker Selector */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.5rem",
                  }}
                >
                  <label
                    style={{
                      fontSize: "0.8rem",
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
                      padding: "1rem 1.5rem",
                      borderRadius: "15px",
                      fontSize: "1.1rem",
                      fontWeight: "800",
                      background: "rgba(0,0,0,0.4)",
                      border: "1px solid rgba(37, 99, 235, 0.2)",
                      color: "white",
                      cursor: "pointer",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.75rem",
                      }}
                    >
                      <Mic2 size={20} color="var(--primary)" />
                      <span>{s.speaker}</span>
                    </div>
                    <ChevronRight size={20} opacity={0.5} />
                  </button>
                </div>

                {/* Text Area */}
                <div
                  style={{
                    display: "flex",
                    gap: "1rem",
                    alignItems: "flex-end",
                  }}
                >
                  <div
                    style={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.5rem",
                    }}
                  >
                    <label
                      style={{
                        fontSize: "0.8rem",
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
                        padding: "1rem",
                        fontSize: "1.1rem",
                        borderRadius: "15px",
                        background: "rgba(0,0,0,0.4)",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        lineHeight: "1.4",
                        resize: "none",
                      }}
                    />
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.5rem",
                      marginBottom: "4px",
                    }}
                  >
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button
                        className="btn btn-secondary"
                        style={{
                          padding: "0",
                          borderRadius: "12px",
                          width: "40px",
                          height: "40px",
                          background: "rgba(255, 255, 255, 0.05)",
                          border: "1px solid rgba(255, 255, 255, 0.1)",
                          color: "white",
                        }}
                        onClick={() => moveSentence(idx, "up")}
                        disabled={idx === 0}
                        title={lang === "th" ? "เลื่อนขึ้น" : "Move Up"}
                      >
                        <ArrowUp size={16} />
                      </button>
                      <button
                        className="btn btn-secondary"
                        style={{
                          padding: "0",
                          borderRadius: "12px",
                          width: "40px",
                          height: "40px",
                          background: "rgba(255, 255, 255, 0.05)",
                          border: "1px solid rgba(255, 255, 255, 0.1)",
                          color: "white",
                        }}
                        onClick={() => moveSentence(idx, "down")}
                        disabled={idx === sentences.length - 1}
                        title={lang === "th" ? "เลื่อนลง" : "Move Down"}
                      >
                        <ArrowDown size={16} />
                      </button>
                    </div>
                    <button
                      className="btn btn-secondary"
                      style={{
                        padding: "0",
                        borderRadius: "12px",
                        width: "100%",
                        height: "50px",
                        background: "rgba(239, 68, 68, 0.1)",
                        border: "1px solid rgba(239, 68, 68, 0.2)",
                        color: "#f87171",
                      }}
                      onClick={() => handleRemoveSentence(idx)}
                      disabled={sentences.length === 1}
                      title={lang === "th" ? "ลบ" : "Delete"}
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Add Next Button - Inside scroll for convenience */}
        <button
          className="btn btn-secondary"
          onClick={handleAddSentence}
          style={{
            width: "100%",
            borderStyle: "dashed",
            borderWidth: "2px",
            background: "rgba(255,255,255,0.02)",
            padding: "1rem",
            fontSize: "1rem",
          }}
        >
          <Plus size={20} /> {t.addNext}
        </button>
      </div>

      {/* Footer Actions - Fixed */}
      <div
        style={{
          paddingTop: "1rem",
          borderTop: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <button
          className="btn btn-primary"
          disabled={!title || sentences.every((s) => !s.text.trim())}
          onClick={handleSave}
          style={{
            width: "100%",
            padding: "1.25rem",
            fontSize: "1.2rem",
            borderRadius: "20px",
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
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                width: "100%",
                maxWidth: "500px",
                maxHeight: "85vh",
                overflowY: "auto",
                padding: "2.5rem",
                background: "rgba(15, 23, 42, 0.95)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "32px",
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: "1rem",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
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
                <h3 style={{ margin: 0, fontSize: "1.5rem" }}>{t.speaker}</h3>
                <button
                  className="btn btn-secondary"
                  style={{
                    minHeight: "auto",
                    padding: "0.5rem",
                    borderRadius: "12px",
                    width: "40px",
                    height: "40px",
                  }}
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
                    padding: 0,
                    fontSize: "1.5rem",
                    fontWeight: 900,
                    width: "100%",
                    height: "60px",
                    borderRadius: "16px",
                    transition: "all 0.2s ease",
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
  const isChineseContent = useMemo(
    () => sentences.some((s) => hasChinese(s.text)),
    [sentences],
  );
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

      // Default to best available voice if none selected
      if (!selectedVoiceName && availableVoices.length > 0) {
        if (isChineseContent) {
          // For Chinese content, ONLY auto-select a Chinese voice
          const zhVoice = availableVoices.find(
            (v) => v.lang.includes("zh") || v.lang.includes("CN"),
          );
          if (zhVoice) {
            setSelectedVoiceName(zhVoice.name);
          } else {
            // No Chinese voice found for Chinese content - leave it empty to signal the issue
            setSelectedVoiceName("");
          }
        } else {
          // For English content, try English then fallback to any
          const enVoice = availableVoices.find(
            (v) =>
              v.lang.includes("en") ||
              v.lang.includes("US") ||
              v.lang.includes("GB"),
          );
          if (enVoice) {
            setSelectedVoiceName(enVoice.name);
          } else {
            setSelectedVoiceName(availableVoices[0].name);
          }
        }
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
    if (isChineseContent && !selectedVoiceName) return;
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

    utterance.lang = isChineseContent ? "zh-CN" : "en-US";
    utterance.rate = 0.9;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    setShowText(false);
  }, [currentIndex]);

  useEffect(() => {
    return () => window.speechSynthesis.cancel();
  }, []);

  const handleNext = () => {
    if (currentIndex < sentences.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      speak(nextIndex);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      setCurrentIndex(prevIndex);
      speak(prevIndex);
    }
  };

  const [hasStartedSet, setHasStartedSet] = useState(false);

  const handleRestart = () => {
    setCurrentIndex(0);
    setHasStartedSet(false);
    setShowText(false);
  };

  const handleMainButtonClick = () => {
    if (!hasStartedSet) setHasStartedSet(true);
    speak(currentIndex);
  };

  const progress = ((currentIndex + 1) / sentences.length) * 100;
  const currentSentence = sentences[currentIndex];

  const isInitialStart = currentIndex === 0 && !hasStartedSet;
  const mainButtonText = isInitialStart
    ? t.startListen
    : isSpeaking
      ? t.speaking
      : t.listenAgain;
  const mainButtonColor = isInitialStart
    ? "linear-gradient(135deg, #10b981, #059669)"
    : "linear-gradient(135deg, #6366f1, #8b5cf6)";

  return (
    <motion.div
      key="reader"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ height: "100%", display: "flex", flexDirection: "column" }}
    >
      <div
        className="glass-card"
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          padding: "1.5rem",
          gap: "1rem",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "1rem",
          }}
        >
          <button
            className="btn btn-secondary"
            onClick={onBack}
            style={{
              minHeight: "auto",
              padding: "0.75rem",
              borderRadius: "12px",
              width: "45px",
              height: "45px",
              flexShrink: 0,
            }}
          >
            <ArrowLeft size={24} />
          </button>

          <div style={{ flex: 1 }}>
            <h3
              style={{
                margin: 0,
                fontSize: "1.4rem",
                fontWeight: 800,
                lineHeight: "1.2",
              }}
            >
              {set.title}
            </h3>
            <p
              style={{
                color: "var(--text-dim)",
                fontSize: "0.9rem",
                marginTop: "0.25rem",
              }}
            >
              {t.setCount
                .replace("{current}", currentIndex + 1)
                .replace("{total}", sentences.length)}
            </p>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <button
            className="btn btn-secondary"
            onClick={() => setIsVoicePickerOpen(true)}
            disabled={
              isChineseContent &&
              !voices.some(
                (v) => v.lang.includes("zh") || v.lang.includes("CN"),
              )
            }
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0.75rem 1.25rem",
              borderRadius: "15px",
              background: "rgba(0,0,0,0.4)",
              minHeight: "50px",
              opacity:
                isChineseContent &&
                !voices.some(
                  (v) => v.lang.includes("zh") || v.lang.includes("CN"),
                )
                  ? 0.5
                  : 1,
              cursor:
                isChineseContent &&
                !voices.some(
                  (v) => v.lang.includes("zh") || v.lang.includes("CN"),
                )
                  ? "not-allowed"
                  : "pointer",
            }}
          >
            <div
              style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}
            >
              <Mic2 size={20} color="var(--primary)" />
              <span
                style={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  maxWidth: "200px",
                }}
              >
                {selectedVoiceName || t.selectVoice}
              </span>
            </div>
            <ChevronRight size={20} opacity={0.5} />
          </button>

          {isChineseContent &&
            voices.length > 0 &&
            !voices.some(
              (v) => v.lang.includes("zh") || v.lang.includes("CN"),
            ) && (
              <div
                style={{
                  padding: "0.5rem 1rem",
                  background: "rgba(239, 68, 68, 0.1)",
                  border: "1px solid rgba(239, 68, 68, 0.2)",
                  borderRadius: "12px",
                  color: "#f87171",
                  fontSize: "0.8rem",
                }}
              >
                <div style={{ fontWeight: 700 }}>{t.noChineseVoice}</div>
                <div style={{ opacity: 0.8 }}>{t.voiceWarning}</div>
              </div>
            )}
        </div>


        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "1.5rem",
            minHeight: 0,
          }}
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
                gap: "1rem",
                width: "100%",
              }}
            >
              <div
                style={{
                  width: "min(120px, 25vh)",
                  height: "min(120px, 25vh)",
                  borderRadius: "50%",
                  background:
                    "linear-gradient(135deg, var(--primary), var(--accent))",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "3rem",
                  fontWeight: "900",
                  boxShadow: "0 10px 30px rgba(37, 99, 235, 0.3)",
                  color: "white",
                  border: "4px solid rgba(255, 255, 255, 0.1)",
                }}
              >
                {currentSentence?.speaker}
              </div>

              <div
                style={{
                  width: "100%",
                  display: "flex",
                  justifyContent: "center",
                  minHeight: "60px",
                }}
              >
                {showText ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="sentence-text"
                    style={{
                      fontSize: "min(2rem, 6vw)",
                      textAlign: "center",
                      padding: "0 1rem",
                    }}
                  >
                    {currentSentence?.text}
                  </motion.div>
                ) : (
                  <button
                    className="btn btn-secondary"
                    onClick={() => setShowText(true)}
                    style={{
                      padding: "0.75rem 2rem",
                      fontSize: "1rem",
                      borderRadius: "20px",
                    }}
                  >
                    {t.showChinese}
                  </button>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
            marginTop: "auto",
          }}
        >
          <motion.button
            className={currentIndex === sentences.length - 1 ? "btn btn-primary" : "btn btn-secondary"}
            onClick={handleRestart}
            animate={
              currentIndex === sentences.length - 1
                ? {
                    scale: [1, 1.05, 1],
                    boxShadow: [
                      "0 0 0px rgba(255, 95, 109, 0)",
                      "0 0 30px rgba(255, 95, 109, 0.8)",
                      "0 0 0px rgba(255, 95, 109, 0)",
                    ],
                  }
                : { scale: 1, boxShadow: "none" }
            }
            transition={{
              scale: { repeat: Infinity, duration: 1.5 },
              boxShadow: { repeat: Infinity, duration: 1.5 },
            }}
            style={{
              width: "100%",
              justifyContent: "center",
              gap: "0.75rem",
              borderRadius: "20px",
              minHeight: "60px",
              fontSize: currentIndex === sentences.length - 1 ? "1.2rem" : "0.9rem",
              padding: "0.5rem",
              border: "none",
              fontWeight: 900,
              background: currentIndex === sentences.length - 1 
                ? "linear-gradient(135deg, #ff5f6d, #ffc371)" 
                : "rgba(255, 255, 255, 0.05)",
              color: "white",
              textShadow: currentIndex === sentences.length - 1 ? "0 2px 4px rgba(0,0,0,0.3)" : "none",
            }}
          >
            <RotateCcw
              size={currentIndex === sentences.length - 1 ? 22 : 18}
              color="white"
            />
            <span style={{ color: "white" }}>
              {t.restart}
            </span>
          </motion.button>
          <div className="progress-bar" style={{ height: "6px" }}>
            <div
              className="progress-inner"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="controls" style={{ gap: "1rem" }}>
            <button
              className="btn btn-secondary"
              style={{
                borderRadius: "15px",
                width: "60px",
                minHeight: "50px",
                color: "white",
                padding: 0,
              }}
              onClick={handlePrev}
              disabled={currentIndex === 0}
            >
              <ChevronLeft size={24} stroke="white" strokeWidth={3} />
            </button>
            <button
              className="btn"
              onClick={handleMainButtonClick}
              style={{
                flex: 1,
                minHeight: "60px",
                borderRadius: "20px",
                background: mainButtonColor,
                color: "white",
                fontSize: "1.2rem",
                fontWeight: 700,
                boxShadow: "0 10px 20px rgba(0,0,0,0.2)",
              }}
            >
              {isSpeaking ? (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    justifyContent: "center",
                  }}
                >
                  <Mic2 size={24} className="speaking-pulse" />
                  <span>{mainButtonText}</span>
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    justifyContent: "center",
                  }}
                >
                  <Play size={24} />
                  <span>{mainButtonText}</span>
                </div>
              )}
            </button>
            <button
              className="btn btn-secondary"
              style={{
                borderRadius: "15px",
                width: "60px",
                minHeight: "50px",
                color: "white",
                padding: 0,
                opacity: currentIndex === sentences.length - 1 ? 0.3 : 1,
              }}
              onClick={handleNext}
              disabled={currentIndex === sentences.length - 1}
            >
              <ChevronRight size={24} stroke="white" strokeWidth={3} />
            </button>
          </div>
        </div>
      </div>

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
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
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
                      padding: "1rem",
                      textAlign: "left",
                    }}
                    onClick={() => {
                      setSelectedVoiceName(v.name);
                      setIsVoicePickerOpen(false);
                    }}
                  >
                    <div style={{ display: "flex", flexDirection: "column" }}>
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
    </motion.div>
  );
};

export default App;
