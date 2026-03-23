import React, { useEffect, useState } from 'react'
import { Container, Grid, Card, CardActionArea, CardMedia, CardContent, Typography, Dialog, IconButton, Button, DialogTitle, DialogContent } from '@mui/material'
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew'
import ArrowForwardIosNewIcon from '@mui/icons-material/ArrowForwardIos'
import SettingsIcon from '@mui/icons-material/Settings';

type Gallery = { [folder: string]: string[] }
type LabelData = { [folder: string]: string[] }
const DEFAULT_LABEL_OPTIONS = ['A', 'B', 'C']

function FolderGrid({ gallery, onOpen }: { gallery: Gallery; onOpen: (folder: string) => void }) {
  return (
    <Grid container spacing={2}>
      {Object.entries(gallery).map(([folder, images]) => (
        <Grid item key={folder} xs={12} sm={6} md={4} lg={3}>
          <Card>
            <CardActionArea onClick={() => onOpen(folder)}>
              <CardMedia component="img" height="160" image={images[0]} alt={`folder-${folder}`} />
              <CardContent>
                <Typography variant="h6">{folder}</Typography>
                <Typography variant="body2" color="text.secondary">{images.length} 枚</Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>
      ))}
    </Grid>
  )
}

function LabelSelector({open, folder, onClose, labelOptions}: {open: boolean; folder: string; onClose: () => void; labelOptions: string[];}) {
  const [labels, setLabels] = useState<string[]>([])

  useEffect(() => {
    if (!open) return

    fetch(`/api/labels/${folder}`)
      .then(async r => {
        if (!r.ok) throw new Error(`GET /api/labels/${folder} failed: ${r.status}`)
        return r.json()
      })
      .then((data: unknown) => {
        setLabels(Array.isArray(data) ? data : [])
      })
      .catch(err => {
        console.error('labels 読み込み失敗', err)
      })
  }, [open, folder])
  
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Label</DialogTitle>
      <DialogContent>
        {labelOptions.map((label) => (
          <Button
            key={label}
            variant={labels.includes(label) ? "contained" : "outlined"}
            onClick={async() => {
              try {
                const next = labels[0] === label ? [] : [label]
                const r = await fetch(`/api/labels/${folder}`, {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ labels: next }),
                });
                if (!r.ok) {
                  throw new Error(`PUT /api/labels failed: ${r.status}`);
                } else {
                  setLabels(next);
                }
              } catch (err) {
                console.error("labels 保存失敗", err);
              }
            }}
          >
            {label}
          </Button>
        ))}
      </DialogContent>
    </Dialog>
  );
}

function Lightbox({ open, images, index, onClose, onPrev, onNext, openFolder, labelOptions }: any) {
  const [labelSelectorOpen, setLabelSelectorOpen] = useState(false)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') onPrev()
      if (e.key === 'ArrowRight') onNext()
    }
    if (open) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose, onPrev, onNext])

  if (!open) return null
  const total = images?.length || 0

  return (
    <Dialog open={open} onClose={onClose} fullScreen PaperProps={{ style: { background: 'rgba(0,0,0,0.95)' } }}>
      {/* ヘッダー */}
      <div className="lightboxHeader">
        <div className="lightboxHeader-left">
          <div className="lightboxTitle" onClick={onClose}>ホームへ</div>
          <div className="lightboxNav">
            <IconButton size="small" onClick={onPrev} style={{ color: 'white' }} aria-label="prev">
              <ArrowBackIosNewIcon fontSize="small" />
            </IconButton>
            <IconButton size="small" onClick={onNext} style={{ color: 'white' }} aria-label="next">
              <ArrowForwardIosNewIcon fontSize="small" />
            </IconButton>
          </div>
        </div>

        <div className="lightboxHeader-right">
          <div className="lightboxPage">
            <IconButton size="small" onClick={() => setLabelSelectorOpen(true)} style={{ color: 'white' }} aria-label="next">
              <SettingsIcon fontSize="small" />
              
            </IconButton>
            <LabelSelector open={labelSelectorOpen} folder={openFolder} onClose={() => setLabelSelectorOpen(false)} labelOptions={labelOptions} />
            
            <label style={{ color: 'white', marginRight: 8 }}>ページ</label>
            <select value={index + 1} onChange={e => {
              const v = parseInt(e.target.value || '1', 10) - 1
              if (!isNaN(v) && v >= 0 && v < total) {
                let diff = v - index
                if (diff > 0) {
                  for (let i = 0; i < diff; i++) onNext()
                } else if (diff < 0) {
                  for (let i = 0; i < -diff; i++) onPrev()
                }
              }
            }}>
              {Array.from({ length: total }, (_, i) => (
                <option key={i} value={i + 1}>{i + 1}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* クリックで左右切替できる左右領域 */}
      <div className="lightboxClickZone left" onClick={(e) => { e.stopPropagation(); onPrev(); }} />
      <div className="lightboxClickZone right" onClick={(e) => { e.stopPropagation(); onNext(); }} />

      {/* 画像表示 */}
      <div className="lightboxImageWrap">
        {total > 0 ? (
          <img src={images[index]} className="lightboxImage" alt={`image-${index + 1}`} />
        ) : (
          <div style={{ color: 'white' }}>No images</div>
        )}
      </div>
    </Dialog>
  )
}

function normalizeLabelData(raw: unknown): LabelData {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
  const normalized: LabelData = {}

  for (const [folder, labels] of Object.entries(raw as Record<string, unknown>)) {
    if (!Array.isArray(labels)) continue
    const valid = labels.filter((v): v is string => typeof v === 'string' && /^[A-Z]$/.test(v))
    normalized[folder] = valid.length > 0 ? [valid[0]] : []
  }

  return normalized
}

function normalizeLabelOptions(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [...DEFAULT_LABEL_OPTIONS]
  const options = Array.from(new Set(raw.filter((v): v is string => typeof v === 'string' && /^[A-Z]$/.test(v))))
  return options.sort(naturalSort)
}

function SettingBox({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: (options: string[]) => void }) {
  const [labelOptions, setLabelOptions] = useState<string[]>([])
  const [newLabel, setNewLabel] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return

    setLoading(true)
    setError(null)
    setMessage(null)

    fetch('/api/label-options')
      .then(async r => {
        if (!r.ok) throw new Error(`GET /api/label-options failed: ${r.status}`)
        return r.json()
      })
      .then((data: unknown) => {
        setLabelOptions(normalizeLabelOptions(data))
      })
      .catch(err => {
        console.error('label options 読み込み失敗', err)
        setError('ラベル種類の読み込みに失敗しました。')
      })
      .finally(() => setLoading(false))
  }, [open])

  function addLabelOption() {
    const next = newLabel.trim().toUpperCase()
    if (!/^[A-Z]$/.test(next)) {
      setError('ラベルは A-Z の1文字で入力してください。')
      return
    }
    if (labelOptions.includes(next)) {
      setError('同じラベルが既に存在します。')
      return
    }
    setLabelOptions(prev => [...prev, next].sort(naturalSort))
    setNewLabel('')
    setError(null)
    setMessage(null)
  }

  function removeLabelOption(label: string) {
    setLabelOptions(prev => prev.filter(v => v !== label))
    setError(null)
    setMessage(null)
  }

  async function saveLabelOptions() {
    setSaving(true)
    setError(null)
    setMessage(null)
    try {
      const r = await fetch('/api/label-options', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ options: labelOptions })
      })
      if (!r.ok) {
        throw new Error(`PUT /api/label-options failed: ${r.status}`)
      }
      setMessage('保存しました。')
      onSaved(labelOptions)
    } catch (err) {
      console.error('label options 保存失敗', err)
      setError('保存に失敗しました。')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose}>
      <div style={{ padding: 24, minWidth: 420 }}>
        <Typography variant="h6" gutterBottom>
          ラベル種類設定
        </Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>ラベルの種類を追加・削除できます。</Typography>

        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <input
            value={newLabel}
            onChange={e => setNewLabel(e.target.value.toUpperCase().slice(0, 1))}
            placeholder="A-Z"
            style={{ width: 80, padding: 8 }}
          />
          <Button variant="outlined" onClick={addLabelOption} disabled={loading || saving}>
            追加
          </Button>
        </div>

        {loading ? (
          <Typography variant="body2">読み込み中...</Typography>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {labelOptions.length === 0 ? (
              <Typography variant="body2">ラベル種類がありません。</Typography>
            ) : (
              labelOptions.map(label => (
                <Button key={label} size="small" variant="outlined" color="error" onClick={() => removeLabelOption(label)}>
                  {label} 削除
                </Button>
              ))
            )}
          </div>
        )}

        {error && <Typography variant="body2" color="error" sx={{ mt: 2 }}>{error}</Typography>}
        {message && <Typography variant="body2" color="success.main" sx={{ mt: 2 }}>{message}</Typography>}

        <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
          <Button
            variant="outlined"
            onClick={onClose}
          >
            閉じる
          </Button>

          <Button
            variant="contained"
            onClick={saveLabelOptions}
            disabled={loading || saving}
          >
            {saving ? '保存中...' : '保存'}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

const naturalSort = (a: string, b: string) => {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
};

export default function Home() {
  const [gallery, setGallery] = useState<Gallery>({})
  const [labelOptions, setLabelOptions] = useState<string[]>(DEFAULT_LABEL_OPTIONS)
  const [openFolder, setOpenFolder] = useState<string | null>(null)
  const [settingOpen, setSettingOpen] = useState(false)
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    fetch('/gallery.json')
      .then(r => r.json())
      .then((data: Gallery) => {
        // 画像リストは名前順にソートする
        Object.keys(data).forEach(k => data[k].sort(naturalSort));
        setGallery(data)
      })
      .catch(err => console.error('gallery.json 読み込み失敗', err))
  }, [])

  const images = openFolder ? gallery[openFolder] || [] : []
  useEffect(() => {
    fetch('/api/label-options')
      .then(async r => {
        if (!r.ok) throw new Error(`GET /api/label-options failed: ${r.status}`)
        return r.json()
      })
      .then((data: unknown) => {
        setLabelOptions(normalizeLabelOptions(data))
      })
      .catch(err => {
        console.error('label options 読み込み失敗', err)
      })
  }, [])

  function open(folder: string) {
    setOpenFolder(folder)
    setIdx(0)
  }
  function close() {
    setOpenFolder(null)
  }
  function prev() {
    setIdx(i => (i - 1 + images.length) % images.length)
  }
  function next() {
    setIdx(i => (i + 1) % images.length)
  }

  // タッチでの簡易スワイプ
  useEffect(() => {
    let startX = 0
    function onTouchStart(e: TouchEvent) { startX = e.touches[0].clientX }
    function onTouchEnd(e: TouchEvent) {
      const endX = e.changedTouches[0].clientX
      const diff = endX - startX
      if (Math.abs(diff) > 40) {
        if (diff > 0) {
          prev();
        } else {
          next();
        }
      }
    }
    if (openFolder) {
      window.addEventListener('touchstart', onTouchStart)
      window.addEventListener('touchend', onTouchEnd)
    }
    return () => {
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchend', onTouchEnd)
    }
  }, [openFolder, prev, next])

  return (
    <Container maxWidth="lg" style={{ marginTop: 24, marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Typography variant="h4" sx={{ mb: 0 }} gutterBottom>ローカル画像館</Typography>
        <IconButton size="large" style={{ color: 'black' }} aria-label="next" onClick={() => setSettingOpen(true)}>
          <SettingsIcon fontSize="medium"/>
        </IconButton>
      </div>
      <SettingBox open={settingOpen} onClose={() => setSettingOpen(false)} onSaved={setLabelOptions} />
      <FolderGrid gallery={gallery} onOpen={open} />
      <Lightbox open={!!openFolder} images={images} index={idx} onClose={close} onPrev={prev} onNext={next} openFolder={openFolder} labelOptions={labelOptions} />
    </Container>
    
  )
}
