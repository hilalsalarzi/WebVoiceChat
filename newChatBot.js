let mediaRecorder;
let audioChunks = [];
let audioContext;
let analyser;
let sourceNode;

// Handle voice record button click
document.getElementById('voice-record-btn').addEventListener('click', function() {
    if (mediaRecorder && mediaRecorder.state === "recording") {
        mediaRecorder.stop();
    } else {
        startRecording();
    }
});

// Start recording audio
function startRecording() {
    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            analyser = audioContext.createAnalyser();
            sourceNode = audioContext.createMediaStreamSource(stream);
            sourceNode.connect(analyser);

            mediaRecorder = new MediaRecorder(stream);
            mediaRecorder.start();
            mediaRecorder.ondataavailable = function(e) {
                audioChunks.push(e.data);
            };
            mediaRecorder.onstop = function() {
                const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                audioChunks = [];
                showVoiceMessage(audioBlob);
            };
        })
        .catch(err => console.log("The following error occurred: " + err));
}

// Show voice message with controls
function showVoiceMessage(audioBlob) {
    const container = document.getElementById('voice-message-container');
    container.style.display = 'flex';

    // Create and append waveform visualizer
    const waveform = document.getElementById('waveform');
    waveform.innerHTML = ''; // Clear previous waveform if any
    drawWaveformVisualizer(waveform);

    // Set up controls
    document.getElementById('send-voice-message').onclick = function() {
        sendVoiceMessage(audioBlob);
        container.style.display = 'none';
    };

    document.getElementById('delete-voice-message').onclick = function() {
        container.style.display = 'none';
    };
}

// Draw waveform visualizer
function drawWaveformVisualizer(waveform) {
    const canvas = document.createElement('canvas');
    waveform.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    canvas.width = waveform.offsetWidth;
    canvas.height = waveform.offsetHeight;

    analyser.fftSize = 256;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    function draw() {
        requestAnimationFrame(draw);
        analyser.getByteFrequencyData(dataArray);
        ctx.fillStyle = 'lightgrey';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        const barWidth = (canvas.width / bufferLength) * 2.5;
        let x = 0;
        for (let i = 0; i < bufferLength; i++) {
            const barHeight = dataArray[i];
            ctx.fillStyle = 'rgb(' + (barHeight + 100) + ',50,50)';
            ctx.fillRect(x, canvas.height - barHeight / 2, barWidth, barHeight / 2);
            x += barWidth + 1;
        }
    }

    draw();
}

// Send voice message
function sendVoiceMessage(audioBlob) {
    const chatWindow = document.getElementById('chat-window');
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('user-message');

    const audioElement = document.createElement('audio');
    audioElement.controls = true;
    audioElement.src = URL.createObjectURL(audioBlob);
    messageDiv.appendChild(audioElement);

    const dropdownContainer = document.createElement('div');
    dropdownContainer.classList.add('dropdown-container');

    const dropdownIcon = document.createElement('button');
    dropdownIcon.classList.add('dropdown-icon');
    dropdownIcon.innerText = '⋮';
    dropdownIcon.onclick = function() {
        const dropdownContent = dropdownContainer.querySelector('.dropdown-content');
        dropdownContent.style.display = dropdownContent.style.display === 'block' ? 'none' : 'block';
    };
    dropdownContainer.appendChild(dropdownIcon);

    const dropdownContent = document.createElement('div');
    dropdownContent.classList.add('dropdown-content');

    const deleteButton = document.createElement('button');
    deleteButton.innerText = 'Delete';
    deleteButton.onclick = function() {
        messageDiv.remove();
    };
    dropdownContent.appendChild(deleteButton);

    dropdownContainer.appendChild(dropdownContent);
    messageDiv.appendChild(dropdownContainer);

    chatWindow.appendChild(messageDiv);
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

// Handle user input Enter key press
document.getElementById('user-input').addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
});

// Send text message
function sendMessage() {
    const inputField = document.getElementById('user-input');
    const messageText = inputField.value.trim();
    if (messageText !== '') {
        const chatWindow = document.getElementById('chat-window');
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('user-message');

        const textSpan = document.createElement('span');
        textSpan.classList.add('editable');
        textSpan.innerText = messageText;
        messageDiv.appendChild(textSpan);

        const dropdownContainer = document.createElement('div');
        dropdownContainer.classList.add('dropdown-container');

        const dropdownIcon = document.createElement('button');
        dropdownIcon.classList.add('dropdown-icon');
        dropdownIcon.innerText = '⋮';
        dropdownIcon.onclick = function() {
            const dropdownContent = dropdownContainer.querySelector('.dropdown-content');
            dropdownContent.style.display = dropdownContent.style.display === 'block' ? 'none' : 'block';
        };
        dropdownContainer.appendChild(dropdownIcon);

        const dropdownContent = document.createElement('div');
        dropdownContent.classList.add('dropdown-content');

        const editButton = document.createElement('button');
        editButton.innerText = 'Edit';
        editButton.onclick = function() {
            editMessage(textSpan);
        };
        dropdownContent.appendChild(editButton);

        const deleteButton = document.createElement('button');
        deleteButton.innerText = 'Delete';
        deleteButton.onclick = function() {
            messageDiv.remove();
        };
        dropdownContent.appendChild(deleteButton);

        dropdownContainer.appendChild(dropdownContent);
        messageDiv.appendChild(dropdownContainer);

        chatWindow.appendChild(messageDiv);
        chatWindow.scrollTop = chatWindow.scrollHeight;

        inputField.value = ''; // Clear the input field after sending the message
    }
}

// Edit message
function editMessage(spanElement) {
    const newMessage = prompt('Edit your message:', spanElement.innerText);
    if (newMessage !== null) {
        spanElement.innerText = newMessage;
    }
}
