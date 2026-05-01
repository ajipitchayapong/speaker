import React, { useState, useEffect, useMemo } from 'react'
import { Plus, Play, Trash2, ArrowLeft, RotateCcw, ChevronRight, ChevronLeft, Mic2, Save, X, Edit2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

// Utility to split text into objects: { speaker, text }
const splitSentences = (text) => {
  if (!text) return []
  return text.split('|||').filter(s => s.trim()).map(s => {
    const [speaker, ...textParts] = s.split(':')
    return { speaker: speaker || 'A', text: textParts.join(':') }
  })
}

const App = () => {
  const [view, setView] = useState('home') // home, reader, editor
  const [sets, setSets] = useState([])
  const [currentSetId, setCurrentSetId] = useState(null)
  const [editingSet, setEditingSet] = useState(null)
  
  // Load sets from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('tts-speech-sets')
    if (saved) {
      setSets(JSON.parse(saved))
    } else {
      // Default set for first time users
      const defaultSet = {
        id: Date.now(),
        title: 'ตัวอย่าง: ภาษาจีนพื้นฐาน',
        content: '你好！很高兴见到你。|||今天天气很好。|||我们要一起学习中文吗？'
      }
      setSets([defaultSet])
      localStorage.setItem('tts-speech-sets', JSON.stringify([defaultSet]))
    }
  }, [])

  // Save sets to localStorage
  const saveToStorage = (newSets) => {
    setSets(newSets)
    localStorage.setItem('tts-speech-sets', JSON.stringify(newSets))
  }

  const handleDeleteSet = (id, e) => {
    e.stopPropagation()
    const newSets = sets.filter(s => s.id !== id)
    saveToStorage(newSets)
  }

  const handleStartSet = (set) => {
    setCurrentSetId(set.id)
    setView('reader')
  }

  const handleCreateNew = () => {
    setEditingSet({ title: '', content: '' })
    setView('editor')
  }

  const handleSaveSet = (title, content) => {
    let newSets
    if (editingSet?.id) {
      newSets = sets.map(s => s.id === editingSet.id ? { ...s, title, content } : s)
    } else {
      newSets = [...sets, { id: Date.now(), title, content }]
    }
    saveToStorage(newSets)
    setView('home')
    setEditingSet(null)
  }

  const handleEditSet = (set, e) => {
    e.stopPropagation()
    setEditingSet(set)
    setView('editor')
  }

  return (
    <div className="container">
      <AnimatePresence mode="wait">
        {view === 'home' && (
          <motion.div 
            key="home"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <header style={{ marginBottom: '6rem', marginTop: '2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '3rem', alignItems: 'center' }}>
              <h1 style={{ margin: 0, fontSize: '3.5rem' }}>Chinese Reader AI</h1>
              <h2 style={{ margin: 0, fontSize: '1.8rem', color: 'rgba(255,255,255,0.7)' }}>ฝึกฟังและอ่านภาษาจีนทีละประโยค</h2>
              <button className="btn btn-primary" onClick={handleCreateNew} style={{ padding: '1.5rem 3.5rem', fontSize: '1.3rem', borderRadius: '25px', marginTop: '1rem' }}>
                <Plus size={28} /> เพิ่มชุดบทพูดใหม่
              </button>
            </header>

            <div className="sets-grid">
              {sets.map(set => (
                <div key={set.id} className="glass-card" onClick={() => handleStartSet(set)} style={{ cursor: 'pointer', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', wordBreak: 'break-word', overflowWrap: 'anywhere', lineHeight: '1.3' }}>{set.title}</h3>
                  <p style={{ 
                    color: 'var(--text-dim)', 
                    fontSize: '1rem', 
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis', 
                    display: '-webkit-box', 
                    WebkitLineClamp: 3, 
                    WebkitBoxOrient: 'vertical',
                    wordBreak: 'break-word',
                    lineHeight: '1.5',
                    flex: 1
                  }}>
                    {set.content.replace(/\|\|\|/g, ' ')}
                  </p>
                  <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ color: '#6366f1', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '1.2rem', padding: '0.5rem' }}>
                      <Play size={20} /> เริ่มอ่าน
                    </div>
                    
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <button className="btn btn-secondary" style={{ flex: 1, padding: '1rem' }} onClick={(e) => handleEditSet(set, e)}>
                        <Edit2 size={20} /> แก้ไข
                      </button>
                      <button className="btn btn-danger" style={{ flex: 1, padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#f87171' }} onClick={(e) => handleDeleteSet(set.id, e)}>
                        <Trash2 size={20} /> ลบ
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {view === 'editor' && (
          <Editor 
            initialData={editingSet} 
            onSave={handleSaveSet} 
            onBack={() => setView('home')} 
          />
        )}

        {view === 'reader' && (
          <Reader 
            set={sets.find(s => s.id === currentSetId)} 
            onBack={() => setView('home')} 
          />
        )}
      </AnimatePresence>
    </div>
  )
}

const Editor = ({ initialData, onSave, onBack }) => {
  const [title, setTitle] = useState(initialData?.title || '')
  
  // Parse existing content: "A:text|||B:text"
  const parseContent = (content) => {
    if (!content) return [{ speaker: 'A', text: '' }]
    return content.split('|||').map(s => {
      if (!s.includes(':')) return { speaker: 'A', text: s }
      const [speaker, ...textParts] = s.split(':')
      return { speaker: speaker || 'A', text: textParts.join(':') }
    })
  }

  const [sentences, setSentences] = useState(parseContent(initialData?.content))

  const handleAddSentence = () => {
    const lastSpeaker = sentences[sentences.length - 1]?.speaker || 'A'
    // Automatically suggest next speaker (A -> B, B -> A or just keep it)
    const nextSpeaker = lastSpeaker === 'A' ? 'B' : 'A'
    setSentences([...sentences, { speaker: nextSpeaker, text: '' }])
  }

  const handleRemoveSentence = (index) => {
    if (sentences.length === 1) return
    const newSentences = [...sentences]
    newSentences.splice(index, 1)
    setSentences(newSentences)
  }

  const handleFieldChange = (index, field, value) => {
    const newSentences = [...sentences]
    newSentences[index][field] = value
    setSentences(newSentences)
  }

  const handleSave = () => {
    const content = sentences
      .filter(s => s.text.trim())
      .map(s => `${s.speaker}:${s.text}`)
      .join('|||')
    onSave(title, content)
  }

  const speakers = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

  return (
    <motion.div 
      key="editor"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="glass-card"
      style={{ maxWidth: '800px', margin: '0 auto' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ margin: 0, color: 'white' }}>{initialData?.id ? 'แก้ไขชุดบทพูด' : 'เพิ่มชุดบทพูดใหม่'}</h2>
        <button className="btn btn-secondary" onClick={onBack}>
          <X size={20} /> ยกเลิก
        </button>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text-dim)' }}>หัวข้อชุดบทพูด</label>
        <input 
          placeholder="เช่น บทเรียนที่ 1..." 
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{ marginBottom: 0 }}
        />
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', marginBottom: '1rem', fontWeight: 600, color: 'var(--text-dim)' }}>รายการประโยคและการระบุคนพูด</label>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {sentences.map((s, idx) => (
            <motion.div 
              layout
              key={idx} 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ 
                display: 'flex', 
                gap: '1.5rem', 
                alignItems: 'flex-start',
                background: 'rgba(255,255,255,0.03)',
                padding: '2rem',
                borderRadius: '24px',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
              }}
            >
              {/* Speaker Column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>คนพูด</label>
                <select 
                  value={s.speaker} 
                  onChange={(e) => handleFieldChange(idx, 'speaker', e.target.value)}
                  style={{ 
                    padding: '1rem', 
                    borderRadius: '16px', 
                    background: 'var(--bg-dark)', 
                    color: 'white', 
                    border: '2px solid rgba(99, 102, 241, 0.2)',
                    width: '100%',
                    fontSize: '1.25rem',
                    fontWeight: '800',
                    textAlign: 'center',
                    marginBottom: 0
                  }}
                >
                  {speakers.map(char => <option key={char} value={char}>{char}</option>)}
                </select>
              </div>

              {/* Text Column */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-dim)' }}>ข้อความประโยคที่ {idx + 1}</label>
                <textarea 
                  placeholder="พิมพ์ภาษาจีนที่นี่..."
                  value={s.text}
                  onChange={(e) => handleFieldChange(idx, 'text', e.target.value)}
                  rows={2}
                  style={{ 
                    marginBottom: 0, 
                    padding: '1.5rem', 
                    fontSize: '1.25rem', 
                    borderRadius: '18px',
                    background: 'rgba(0,0,0,0.4)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    lineHeight: '1.6',
                    resize: 'none'
                  }}
                />
              </div>

              {/* Actions Column */}
              <div style={{ paddingTop: '2.4rem' }}>
                <button 
                  className="btn btn-danger" 
                  style={{ 
                    padding: '0', 
                    borderRadius: '16px', 
                    width: '60px', 
                    height: '60px',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    minHeight: 'auto'
                  }}
                  onClick={() => handleRemoveSentence(idx)}
                  disabled={sentences.length === 1}
                  title="ลบประโยคนี้"
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
        style={{ width: '100%', marginBottom: '2.5rem', borderStyle: 'dashed', borderWidth: '2px', background: 'rgba(255,255,255,0.02)', padding: '1.5rem', fontSize: '1.1rem' }}
      >
        <Plus size={24} /> เพิ่มประโยคถัดไป
      </button>

      <div style={{ display: 'flex', gap: '1.5rem' }}>
        <button 
          className="btn btn-primary" 
          disabled={!title || sentences.every(s => !s.text.trim())} 
          onClick={handleSave}
          style={{ flex: 1, padding: '1.5rem', fontSize: '1.25rem', borderRadius: '24px' }}
        >
          <Save size={24} /> บันทึกชุดบทพูดทั้งหมด
        </button>
      </div>
    </motion.div>
  )
}

const Reader = ({ set, onBack }) => {
  const sentences = useMemo(() => splitSentences(set.content), [set.content])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [selectedVoiceName, setSelectedVoiceName] = useState('')
  const [showText, setShowText] = useState(false)
  const [isVoicePickerOpen, setIsVoicePickerOpen] = useState(false)

  const [voices, setVoices] = useState([])

  // Load voices
  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices()
      setVoices(availableVoices)
      
      if (!selectedVoiceName) {
        const zhVoice = availableVoices.find(v => v.lang.includes('zh') || v.lang.includes('CN'))
        if (zhVoice) setSelectedVoiceName(zhVoice.name)
      }
    }
    
    loadVoices()
    window.speechSynthesis.onvoiceschanged = loadVoices
    return () => {
      window.speechSynthesis.onvoiceschanged = null
    }
  }, [selectedVoiceName])

  const speak = (index) => {
    if (!sentences[index]) return
    window.speechSynthesis.cancel()
    
    const utterance = new SpeechSynthesisUtterance(sentences[index].text)
    
    let voice = voices.find(v => v.name === selectedVoiceName)
    if (!voice) {
      voice = voices.find(v => v.lang.includes('zh') || v.lang.includes('CN'))
    }
    
    if (voice) {
      utterance.voice = voice
    }
    
    utterance.lang = 'zh-CN'
    utterance.rate = 0.9
    
    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    window.speechSynthesis.speak(utterance)
  }

  // Reset showText when index changes
  useEffect(() => {
    setShowText(false)
  }, [currentIndex])

  const [hasInteracted, setHasInteracted] = useState(false)

  useEffect(() => {
    if (voices.length > 0 && hasInteracted) {
      speak(currentIndex)
    }
    return () => window.speechSynthesis.cancel()
  }, [currentIndex, voices, hasInteracted])

  useEffect(() => {
    const handleFirstInteraction = () => {
      setHasInteracted(true)
      window.removeEventListener('mousedown', handleFirstInteraction)
    }
    window.addEventListener('mousedown', handleFirstInteraction)
    return () => window.removeEventListener('mousedown', handleFirstInteraction)
  }, [])

  const handleNext = () => {
    if (currentIndex < sentences.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
  }

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  const [hasStartedSet, setHasStartedSet] = useState(false)

  // Reset state when restarting
  const handleRestart = () => {
    setCurrentIndex(0)
    setHasStartedSet(false)
    setShowText(false)
  }

  // Handle Main Button Click
  const handleMainButtonClick = () => {
    if (!hasStartedSet) setHasStartedSet(true)
    speak(currentIndex)
  }

  const progress = ((currentIndex + 1) / sentences.length) * 100
  const currentSentence = sentences[currentIndex]

  // Button Style logic
  const isInitialStart = currentIndex === 0 && !hasStartedSet
  const mainButtonText = isInitialStart ? 'เริ่มฟังบทพูด' : (isSpeaking ? 'กำลังพูด...' : 'ฟังอีกครั้ง')
  const mainButtonColor = isInitialStart 
    ? 'linear-gradient(135deg, #10b981, #059669)' // Green for Start
    : 'linear-gradient(135deg, #6366f1, #8b5cf6)' // Blue/Purple for Repeat

  return (
    <motion.div 
      key="reader"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
    >
      <button className="btn btn-secondary" onClick={onBack} style={{ marginBottom: '2rem' }}>
        <ArrowLeft size={20} /> กลับหน้าหลัก
      </button>

      <div className="glass-card">
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '2rem', 
          marginBottom: '2.5rem',
          paddingBottom: '2rem',
          borderBottom: '1px solid rgba(255,255,255,0.05)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800 }}>{set.title}</h3>
              <p style={{ color: 'var(--text-dim)', fontSize: '1.1rem', marginTop: '0.5rem' }}>ลำดับที่ {currentIndex + 1} จาก {sentences.length}</p>
            </div>
            <button className="btn btn-secondary" style={{ width: '60px', height: '60px', borderRadius: '50%' }} onClick={handleRestart} title="เริ่มใหม่">
              <RotateCcw size={24} />
            </button>
          </div>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              {voices.length === 0 ? (
                <div style={{ padding: '1.25rem 2rem', background: 'rgba(0,0,0,0.3)', borderRadius: '20px', color: '#ec4899' }}>กำลังโหลดเสียง...</div>
              ) : (
                <button 
                  className="btn btn-secondary" 
                  onClick={() => setIsVoicePickerOpen(true)}
                  style={{ 
                    width: '100%', 
                    justifyContent: 'space-between', 
                    padding: '1.25rem 2rem', 
                    borderRadius: '20px',
                    fontSize: '1.1rem',
                    background: 'rgba(0,0,0,0.4)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Mic2 size={24} color="var(--primary)" />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '250px' }}>
                      {selectedVoiceName || 'เลือกเสียงพูด (อัตโนมัติ)'}
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
                position: 'fixed', 
                top: 0, 
                left: 0, 
                right: 0, 
                bottom: 0, 
                background: 'rgba(0,0,0,0.85)', 
                backdropFilter: 'blur(10px)',
                zIndex: 1000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2rem'
              }}
              onClick={() => setIsVoicePickerOpen(false)}
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="glass-card"
                style={{ 
                  width: '100%', 
                  maxWidth: '600px', 
                  maxHeight: '80vh', 
                  overflowY: 'auto',
                  padding: '2rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem'
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ margin: 0 }}>เลือกเสียงพูด</h3>
                  <button className="btn btn-secondary" style={{ minHeight: 'auto', padding: '0.5rem' }} onClick={() => setIsVoicePickerOpen(false)}>
                    <X size={24} />
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <button 
                    className={`btn ${!selectedVoiceName ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ justifyContent: 'flex-start', padding: '1.5rem' }}
                    onClick={() => { setSelectedVoiceName(''); setIsVoicePickerOpen(false); }}
                  >
                    อัตโนมัติ (ภาษาจีน)
                  </button>
                  
                  {(voices.some(v => v.lang.includes('zh') || v.lang.includes('CN')) 
                    ? voices.filter(v => v.lang.includes('zh') || v.lang.includes('CN'))
                    : voices
                  ).map(v => (
                    <button 
                      key={v.name}
                      className={`btn ${selectedVoiceName === v.name ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ justifyContent: 'flex-start', padding: '1.5rem', textAlign: 'left' }}
                      onClick={() => { setSelectedVoiceName(v.name); setIsVoicePickerOpen(false); }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                        <span style={{ fontWeight: 700 }}>{v.name}</span>
                        <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>{v.lang}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="progress-bar" style={{ height: '8px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)' }}>
          <div className="progress-inner" style={{ width: `${progress}%`, borderRadius: '4px', boxShadow: '0 0 15px var(--primary)' }}></div>
        </div>

        <div className="sentence-container" style={{ flexDirection: 'column', gap: '3rem' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem' }}
            >
              {/* Speaker Indicator */}
              <div style={{ 
                width: '180px', 
                height: '180px', 
                borderRadius: '50%', 
                background: 'linear-gradient(135deg, var(--primary), var(--accent))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '5rem',
                fontWeight: '900',
                boxShadow: '0 15px 40px rgba(99, 102, 241, 0.4)',
                color: 'white',
                border: '8px solid rgba(255, 255, 255, 0.1)'
              }}>
                {currentSentence.speaker}
              </div>
              
              <div style={{ color: 'white', fontSize: '1.5rem', fontWeight: 600, opacity: 0.8 }}>
                ผู้พูด {currentSentence.speaker}
              </div>

              {/* Revealable Text */}
              <div style={{ minHeight: '120px', display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'center' }}>
                {showText ? (
                  <motion.div 
                    initial={{ opacity: 0, filter: 'blur(10px)' }} 
                    animate={{ opacity: 1, filter: 'blur(0px)' }}
                    className="sentence-text"
                  >
                    {currentSentence.text}
                  </motion.div>
                ) : (
                  <button 
                    className="btn btn-secondary" 
                    onClick={() => setShowText(true)} 
                    style={{ padding: '1.5rem 3rem', fontSize: '1.2rem', borderRadius: '25px', opacity: 0.8 }}
                  >
                    แสดงข้อความภาษาจีน
                  </button>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="controls" style={{ gap: '1.5rem' }}>
          <button className="btn btn-secondary" style={{ borderRadius: '25px', width: '80px' }} onClick={handlePrev} disabled={currentIndex === 0}>
            <ChevronLeft size={32} />
          </button>
          
          <button 
            className="btn btn-primary" 
            style={{ 
              padding: '1.5rem 4rem', 
              fontSize: '1.5rem', 
              borderRadius: '30px', 
              flex: 1, 
              maxWidth: '400px',
              background: mainButtonColor,
              boxShadow: isInitialStart ? '0 10px 30px rgba(16, 185, 129, 0.3)' : '0 10px 30px rgba(99, 102, 241, 0.3)'
            }} 
            onClick={handleMainButtonClick}
          >
            <Mic2 size={32} /> {mainButtonText}
          </button>

          <button className="btn btn-secondary" style={{ borderRadius: '25px', width: '80px' }} onClick={handleNext} disabled={currentIndex === sentences.length - 1}>
            <ChevronRight size={32} />
          </button>
        </div>
        
        {currentIndex === sentences.length - 1 && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            style={{ textAlign: 'center', marginTop: '3rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}
          >
            <div style={{ color: '#ec4899', fontWeight: 600, fontSize: '1.4rem' }}>
              จบชุดบทพูดแล้ว! 🎉
            </div>
            <button 
              className="btn btn-primary" 
              onClick={handleRestart}
              style={{ background: 'linear-gradient(135deg, #ec4899, #8b5cf6)', padding: '1rem 3rem' }}
            >
              <RotateCcw size={20} /> เริ่มใหม่อีกครั้ง
            </button>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}

export default App
