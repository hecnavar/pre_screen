const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { exec } = require('child_process');
const path = require('path');
const SerialPort = require('serialport');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Construir la ruta al directorio que contiene server.js
const currentDirectory = process.cwd();
const publicPath = path.join(currentDirectory, '../public');

// Servir el archivo index.html desde el directorio public
app.get('/', (req, res) => {
    const indexPath = path.join(publicPath, 'index.html');
    res.sendFile(indexPath);
});

io.on('connection', (socket) => {
    console.log('Cliente conectado');

    // Manejar el comando recibido desde el cliente
    socket.on('command', (command) => {
        // Ejecutar el comando en la consola
        exec(command, (error, stdout, stderr) => {
            if (error) {
                io.emit('output', `Error: ${error.message}`);
                return;
            }
            io.emit('output', stdout || stderr);
        });
    });

    // Función para detectar puertos seriales
    function detectSerialPorts() {
        exec('mode', (error, stdout, stderr) => {
            if (error) {
                console.error('Error al obtener la lista de puertos seriales:', error);
                return;
            }

            const portRegex = /COM\d+/g; // Expresión regular para encontrar puertos COM (Windows)
            const ports = stdout.match(portRegex);

            if (ports) {
                console.log('Puertos seriales disponibles al detectar manualmente:');
                ports.forEach(port => {
                    console.log(port);
                    // Puedes emitir la información de los puertos a los clientes conectados si es necesario
                    io.emit('serialPort', port);
                });
            } else {
                console.log('No se encontraron puertos seriales.');
            }
        });
    }

    // Llama a detectSerialPorts cuando recibas el evento 'searchSerialPorts'
    socket.on('searchSerialPorts', () => {
        detectSerialPorts();
    });

    socket.on('disconnect', () => {
        console.log('Cliente desconectado');
    });
});


const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
});