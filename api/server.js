const express = require('express');
const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');

const app = express();
const port = Number(process.env.PORT || 8787);
const labelsFile = path.resolve(__dirname, 'label_data.json');
const labelOptionsFile = path.resolve(__dirname, 'label_options.json');
const defaultLabelOptions = ['A', 'B', 'C'];

app.use(express.json({ limit: '1mb' }));

app.use((req, res, next) => {
  // Frontend dev server (Vite) からの呼び出しを許可
  res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  next();
});

async function ensureLabelsFile() {
  const dir = path.dirname(labelsFile);
  if (!fs.existsSync(dir)) {
    await fsp.mkdir(dir, { recursive: true });
  }
  if (!fs.existsSync(labelsFile)) {
    await fsp.writeFile(labelsFile, '{}\n', 'utf-8');
  }
}

async function ensureLabelOptionsFile() {
  const dir = path.dirname(labelOptionsFile);
  if (!fs.existsSync(dir)) {
    await fsp.mkdir(dir, { recursive: true });
  }
  if (!fs.existsSync(labelOptionsFile)) {
    await fsp.writeFile(labelOptionsFile, `${JSON.stringify(defaultLabelOptions, null, 2)}\n`, 'utf-8');
  }
}

async function readLabels() {
  await ensureLabelsFile();
  const raw = await fsp.readFile(labelsFile, 'utf-8');
  try {
    const data = JSON.parse(raw);
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      return data;
    }
    return {};
  } catch {
    return {};
  }
}

function normalizeLabelOptions(raw) {
  if (!Array.isArray(raw)) return [...defaultLabelOptions];
  return Array.from(new Set(raw.filter(v => typeof v === 'string' && /^[A-Z]$/.test(v)))).sort();
}

async function readLabelOptions() {
  await ensureLabelOptionsFile();
  const raw = await fsp.readFile(labelOptionsFile, 'utf-8');
  try {
    return normalizeLabelOptions(JSON.parse(raw));
  } catch {
    return [...defaultLabelOptions];
  }
}

function validateLabelsPayload(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return 'Payload must be an object.';
  }

  for (const [folder, labels] of Object.entries(payload)) {
    if (!Array.isArray(labels)) {
      return `labels for "${folder}" must be an array.`;
    }
    if (labels.length > 1) {
        return `labels for "${folder}" must contain at most one label.`;
    }

    for (const label of labels) {
      if (typeof label !== 'string' || label.length === 0) {
        return `labels for "${folder}" must contain non-empty strings.`;
      }
      if (!/^[A-Z]$/.test(label)) {
        return `label "${label}" in "${folder}" must be A-Z single character.`;
      }
    }
  }

  return null;
}

function validateLabelOptionsPayload(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return 'Payload must be an object.';
  }
  if (!Array.isArray(payload.options)) {
    return 'options must be an array.';
  }
  for (const option of payload.options) {
    if (typeof option !== 'string' || !/^[A-Z]$/.test(option)) {
      return `option "${option}" must be A-Z single character.`;
    }
  }
  return null;
}

app.get('/api/label-options', async (_req, res) => {
  try {
    const options = await readLabelOptions();
    res.json(options);
  } catch (err) {
    console.error('Failed to read label_options.json:', err);
    res.status(500).json({ error: 'Failed to read label options.' });
  }
});

app.put('/api/label-options', async (req, res) => {
  try {
    const payload = req.body;
    const error = validateLabelOptionsPayload(payload);
    if (error) {
      res.status(400).json({ error });
      return;
    }

    const options = normalizeLabelOptions(payload.options);
    await ensureLabelOptionsFile();
    await fsp.writeFile(labelOptionsFile, `${JSON.stringify(options, null, 2)}\n`, 'utf-8');

    // Remove assigned labels that are no longer valid options.
    const labels = await readLabels();
    for (const folder of Object.keys(labels)) {
      const current = Array.isArray(labels[folder]) ? labels[folder] : [];
      const filtered = current.filter(label => options.includes(label));
      labels[folder] = filtered.length > 0 ? [filtered[0]] : [];
    }
    await fsp.writeFile(labelsFile, `${JSON.stringify(labels, null, 2)}\n`, 'utf-8');

    res.json({ ok: true, options });
  } catch (err) {
    console.error('Failed to write label_options.json:', err);
    res.status(500).json({ error: 'Failed to save label options.' });
  }
});

app.get('/api/labels', async (_req, res) => {
  try {
    const data = await readLabels();
    res.json(data);
  } catch (err) {
    console.error('Failed to read label_data.json:', err);
    res.status(500).json({ error: 'Failed to read labels.' });
  }
});

app.get('/api/labels/:folder', async (req, res) => {
    try {
        const folder = req.params.folder;
        const data = await readLabels();
        const labels = data[folder] || [];
        res.json(labels);
    } catch (err) {
        console.error('Failed to read label_data.json:', err);
        res.status(500).json({ error: 'Failed to read labels.' });
    }
});

app.put('/api/labels', async (req, res) => {
  try {
    const payload = req.body;
    const error = validateLabelsPayload(payload);
    if (error) {
      res.status(400).json({ error });
      return;
    }

    await ensureLabelsFile();
    await fsp.writeFile(labelsFile, `${JSON.stringify(payload, null, 2)}\n`, 'utf-8');
    res.json({ ok: true });
  } catch (err) {
    console.error('Failed to write label_data.json:', err);
    res.status(500).json({ error: 'Failed to save labels.' });
  }
});

app.put('/api/labels/:folder', async (req, res) => {
    try {
        const folder = req.params.folder;
        const payload = req.body;
        if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
            res.status(400).json({ error: 'Payload must be an object.' });
            return;
        }
        const labels = payload.labels;
        if (!Array.isArray(labels)) {
            res.status(400).json({ error: 'labels must be an array.' });
            return;
        }
        if (labels.length > 1) {
            res.status(400).json({ error: 'labels must contain at most one label.' });
            return;
        }
        for (const label of labels) {
            if (typeof label !== 'string' || label.length === 0) {
                res.status(400).json({ error: 'labels must contain non-empty strings.' });
                return;
            }
            if (!/^[A-Z]$/.test(label)) {
                res.status(400).json({ error: `label "${label}" must be A-Z single character.` });
                return;
            }
        }

        const data = await readLabels();
        data[folder] = labels;
        await fsp.writeFile(labelsFile, `${JSON.stringify(data, null, 2)}\n`, 'utf-8');
        res.json({ ok: true });
    } catch (err) {
        console.error('Failed to write label_data.json:', err);
        res.status(500).json({ error: 'Failed to save labels.' });
    }
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.listen(port, () => {
  console.log(`Label API listening on http://localhost:${port}`);
});
