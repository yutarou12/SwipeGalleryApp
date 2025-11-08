const fs = require('fs')
const path = require('path')

const dataDir = path.join(__dirname, '..', 'public', 'data')
const outFile = path.join(__dirname, '..', 'public', 'gallery.json')

function isImage(name) {
  return /\.(png|jpe?g|gif|webp|svg)$/i.test(name)
}

if (!fs.existsSync(dataDir)) {
  console.log('public/data フォルダが見つかりません。サンプルを作成します。')
  fs.mkdirSync(dataDir, { recursive: true })
  // make sample folders
  for (let i = 1; i <= 2; i++) {
    const folder = path.join(dataDir, String(i))
    fs.mkdirSync(folder, { recursive: true })
    for (let j = 1; j <= 3; j++) {
      const file = path.join(folder, `img${j}.svg`)
      fs.writeFileSync(file, `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="100%" height="100%" fill="hsl(${(i*50 + j*30)%360},60%,70%)"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="48" fill="#222">Folder ${i} / img${j}</text></svg>`)
    }
  }
}

const result = {}
for (const folderName of fs.readdirSync(dataDir)) {
  const folderPath = path.join(dataDir, folderName)
  if (!fs.statSync(folderPath).isDirectory()) continue
  const files = fs.readdirSync(folderPath).filter(isImage).map(f => path.posix.join('/data', folderName, f))
  files.sort()
  if (files.length) result[folderName] = files
}

fs.writeFileSync(outFile, JSON.stringify(result, null, 2), 'utf-8')
console.log('gallery.json を生成しました:', outFile)
