import React, { useEffect, useState } from 'react'
import { Container, Grid, Card, CardActionArea, CardMedia, CardContent, Typography, Dialog, IconButton, Button } from '@mui/material'
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew'
import ArrowForwardIosNewIcon from '@mui/icons-material/ArrowForwardIos'

type Gallery = { [folder: string]: string[] }

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

function Lightbox({ open, images, index, onClose, onPrev, onNext }: any) {
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

const naturalSort = (a: string, b: string) => {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
};

export default function App() {
  const [gallery, setGallery] = useState<Gallery>({})
  const [openFolder, setOpenFolder] = useState<string | null>(null)
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
      <Typography variant="h4" gutterBottom>ローカル画像館</Typography>
      <FolderGrid gallery={gallery} onOpen={open} />
      <Lightbox open={!!openFolder} images={images} index={idx} onClose={close} onPrev={prev} onNext={next} />
    </Container>
  )
}
