const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;

// Configuración de Multer para manejar la carga de archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    var projectPath;
    const projectId = uuidv4(); // Generar un ID único para el proyecto
    if (req.originalUrl.includes("project")) {
      projectPath = `uploads/projects/${req.body.name}`;
    } else {
      projectPath = `uploads/projects/`;
    }
    fs.mkdirSync(projectPath, { recursive: true });
    cb(null, projectPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// Simulación de una base de datos en memoria
const models = {};
const directoriesDB = {};

// Crear un directorio
app.post('/create-project', upload.array('files', 10), (req, res) => {
  const directoryId = uuidv4(); // Generar un ID único para el directorio

  // Guardar los detalles del directorio en una base de datos simulada
  const directoryDetails = {
    id: directoryId,
    name: req.body.name,
    description: req.body.description,
    files: req.files.map(file => file.filename),
  };

  // Puedes guardar directoryDetails en una base de datos o en memoria
  directoriesDB[directoryId] = directoryDetails;

  res.status(201).json({ directoryDetails, message: 'Directory created successfully' });
});

// Obtener un directorio por su ID
app.get('/get-project/:directoryId', (req, res) => {
  const directoryId = req.params.directoryId;
  const directory = directoriesDB[directoryId];
  if (directory) {
    res.status(200).json(directory);
  } else {
    res.status(404).json({ message: 'Directory not found' });
  }
});

// Actualizar un directorio por su ID
app.post('/update-project/:directoryId', upload.array('files', 10), (req, res) => {
  const directoryId = req.params.directoryId;

  // Guardar los detalles del directorio en una base de datos simulada
  const updatedDirectory = {
    id: directoryId,
    name: req.body.name,
    description: req.body.description,
    files: req.files.map(file => file.filename),
  };

  // Puedes guardar directoryDetails en una base de datos o en memoria
  directoriesDB[directoryId] = updatedDirectory;
  res.status(200).json({ updatedDirectory, message: 'Directory updated successfully' });
});

// Eliminar un directorio por su ID
app.delete('/delete-project/:directoryId', (req, res) => {
  const directoryId = req.params.directoryId;
  const name = directoriesDB[directoryId].name;
  delete directoriesDB[directoryId];
  const directoryPath = `uploads/projects/${name}`;
  fs.rmdirSync(directoryPath, { recursive: true });
  res.status(200).json({ message: 'Directory deleted successfully' });
});

// Subir un modelo 3D
app.post('/upload-model', upload.single('file'), (req, res) => {
  const fileId = uuidv4(); // Generar un ID único para el archivo
  const filename = req.file ? req.file.filename : undefined;

  if (!filename) {
    res.status(400).json({ message: 'No file provided' });
    return;
  }

  models[fileId] = filename;
  res.status(201).json({ fileId, message: 'File uploaded successfully' });
});

// Obtener un modelo 3D por su ID
app.get('/get-model/:fileId', (req, res) => {
  const fileId = req.params.fileId;
  const filename = models[fileId];

  if (!filename) {
    res.status(404).json({ message: 'File not found' });
    return;
  }

  const filePath = path.join(__dirname, `uploads/projects/${filename}`);
  res.sendFile(filePath);
});

// Subir o editar un archivo
app.post('/update-model/:fileId', upload.single('file'), (req, res) => {
  const fileId = req.params.fileId;
  const filename = req.file ? req.file.filename : undefined;

  if (!filename) {
    res.status(400).json({ message: 'No file provided' });
    return;
  }

  models[fileId] = filename;
  res.status(200).json({ fileId, message: 'File uploaded/updated successfully' });
});

// Eliminar un modelo 3D por su ID
app.delete('/delete-model/:fileId', (req, res) => {
  const fileId = req.params.fileId;
  const filename = models[fileId];

  if (!filename) {
    res.status(404).json({ message: 'File not found' });
    return;
  }

  const filePath = path.join(__dirname, `uploads/projects/${filename}`);
  fs.unlinkSync(filePath);
  delete models[fileId];
  res.status(200).json({ message: 'File deleted successfully' });
});

app.get('/all-models', (req, res) => {
  const modelFiles = getAllModels('uploads');

  res.json(modelFiles);
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});


function getAllModels(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);

  arrayOfFiles = arrayOfFiles || [];

  files.forEach(file => {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
    } else {
      arrayOfFiles.push(path.join(__dirname, dirPath, "/", file));
    }
  });

  return arrayOfFiles;
}
