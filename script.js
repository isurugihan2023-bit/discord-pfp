
// Selectors
const card = document.querySelector('.profile-card');
const container = document.querySelector('.container');
const statusCard = document.querySelector('.status-card-box');
const syncBtn = document.getElementById('sync-btn');
const counterVal = document.getElementById('counter-val');

// Tilt Effect for the card
if (container && card) {
    container.addEventListener('mousemove', (e) => {
        let xAxis = (window.innerWidth / 2 - e.pageX) / 25;
        let yAxis = (window.innerHeight / 2 - e.pageY) / 25;
        card.style.transform = `rotateY(${xAxis}deg) rotateX(${yAxis}deg)`;
    });

    container.addEventListener('mouseenter', () => {
        card.style.transition = 'none';
    });

    container.addEventListener('mouseleave', () => {
        card.style.transition = 'all 0.5s ease';
        card.style.transform = `rotateY(0deg) rotateX(0deg)`;
    });
}

// Shape Grid Implementation
function initShapeGrid() {
    const canvas = document.getElementById('shape-grid-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const config = {
        direction: 'diagonal',
        speed: 0.5,
        borderColor: 'rgba(0, 173, 238, 0.15)',
        squareSize: 40,
        hoverFillColor: 'rgba(0, 173, 238, 0.25)',
        shape: 'hexagon', 
        hoverTrailAmount: 15
    };

    let numSquaresX, numSquaresY;
    const gridOffset = { x: 0, y: 0 };
    let hoveredSquare = null;
    const trailCells = [];
    const cellOpacities = new Map();

    const isHex = config.shape === 'hexagon';
    const hexHoriz = config.squareSize * 1.5;
    const hexVert = config.squareSize * Math.sqrt(3);

    const resizeCanvas = () => {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        numSquaresX = Math.ceil(canvas.width / config.squareSize) + 1;
        numSquaresY = Math.ceil(canvas.height / config.squareSize) + 1;
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    const drawHex = (cx, cy, size) => {
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i;
            const vx = cx + size * Math.cos(angle);
            const vy = cy + size * Math.sin(angle);
            if (i === 0) ctx.moveTo(vx, vy);
            else ctx.lineTo(vx, vy);
        }
        ctx.closePath();
    };

    const drawGrid = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (isHex) {
            const colShift = Math.floor(gridOffset.x / hexHoriz);
            const offsetX = ((gridOffset.x % hexHoriz) + hexHoriz) % hexHoriz;
            const offsetY = ((gridOffset.y % hexVert) + hexVert) % hexVert;
            for (let col = -2; col < Math.ceil(canvas.width / hexHoriz) + 3; col++) {
                for (let row = -2; row < Math.ceil(canvas.height / hexVert) + 3; row++) {
                    const cx = col * hexHoriz + offsetX;
                    const cy = row * hexVert + ((col + colShift) % 2 !== 0 ? hexVert / 2 : 0) + offsetY;
                    const cellKey = `${col},${row}`;
                    const alpha = cellOpacities.get(cellKey);
                    if (alpha) {
                        ctx.globalAlpha = alpha;
                        drawHex(cx, cy, config.squareSize);
                        ctx.fillStyle = config.hoverFillColor;
                        ctx.fill();
                        ctx.globalAlpha = 1;
                    }
                    drawHex(cx, cy, config.squareSize);
                    ctx.strokeStyle = config.borderColor;
                    ctx.stroke();
                }
            }
        }
    };

    const updateAnimation = () => {
        const wrapX = isHex ? hexHoriz * 2 : config.squareSize;
        const wrapY = isHex ? hexVert : config.squareSize;
        gridOffset.x = (gridOffset.x - config.speed + wrapX) % wrapX;
        gridOffset.y = (gridOffset.y - config.speed + wrapY) % wrapY;
        updateCellOpacities();
        drawGrid();
        requestAnimationFrame(updateAnimation);
    };

    const updateCellOpacities = () => {
        const targets = new Map();
        if (hoveredSquare) targets.set(`${hoveredSquare.x},${hoveredSquare.y}`, 1);
        for (let i = 0; i < trailCells.length; i++) {
            const key = `${trailCells[i].x},${trailCells[i].y}`;
            if (!targets.has(key)) targets.set(key, (trailCells.length - i) / (trailCells.length + 1));
        }
        for (const [key] of targets) if (!cellOpacities.has(key)) cellOpacities.set(key, 0);
        for (const [key, opacity] of cellOpacities) {
            const target = targets.get(key) || 0;
            const next = opacity + (target - opacity) * 0.1;
            if (next < 0.01) cellOpacities.delete(key);
            else cellOpacities.set(key, next);
        }
    };

    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const colShift = Math.floor(gridOffset.x / hexHoriz);
        const col = Math.round((mouseX - ((gridOffset.x % hexHoriz) + hexHoriz) % hexHoriz) / hexHoriz);
        const row = Math.round((mouseY - (((gridOffset.y % hexVert) + hexVert) % hexVert + ((col + colShift) % 2 !== 0 ? hexVert / 2 : 0))) / hexVert);
        if (!hoveredSquare || hoveredSquare.x !== col || hoveredSquare.y !== row) {
            if (hoveredSquare) {
                trailCells.unshift({ ...hoveredSquare });
                if (trailCells.length > config.hoverTrailAmount) trailCells.length = config.hoverTrailAmount;
            }
            hoveredSquare = { x: col, y: row };
        }
    });

    canvas.addEventListener('mouseleave', () => {
        if (hoveredSquare) trailCells.unshift({ ...hoveredSquare });
        hoveredSquare = null;
    });

    requestAnimationFrame(updateAnimation);
}

initShapeGrid();

// Discord Lanyard Integration
const DISCORD_ID = '928546532037394453'; 

async function fetchDiscordStatus() {
    const id = localStorage.getItem('discord_id') || DISCORD_ID;
    if (!id || id === 'YOUR_DISCORD_ID') return;

    try {
        const response = await fetch(`https://api.lanyard.rest/v1/users/${id}?t=${Date.now()}`);
        const data = await response.json();
        if (data.success) {
            updatePresence(data.data);
        }
    } catch (error) {
        console.error('Error fetching Discord status:', error);
    }
}

function updatePresence(data) {
    if (!data) return;
    console.log('Discord Update:', data.discord_user.username, data.discord_status);

    const statusText = document.querySelector('.status-text');
    const statusUsername = document.querySelector('.status-username');
    const statusIndicator = document.querySelector('.status-indicator');
    const miniStatus = document.querySelector('.mini-status');
    const mainAvatar = document.querySelector('.avatar-img');
    const miniAvatar = document.querySelector('.mini-avatar');
    const statusTag = document.querySelector('.status-tag');
    const spotifyCover = document.querySelector('.spotify-cover');
    const spotifySong = document.querySelector('.song-name');
    const spotifyArtist = document.querySelector('.artist-name');
    const voiceDetails = document.querySelector('.voice-details');
    const customStatusHeader = document.getElementById('custom-status-container');
    
    // Update Name and Tag
    const globalName = data.discord_user.global_name || data.discord_user.username;
    if (statusUsername) statusUsername.innerText = globalName;
    
    // Update Custom Status Capsule
    if (customStatusHeader) {
        const customStatus = data.activities.find(a => a.type === 4);
        if (customStatus && (customStatus.state || customStatus.emoji)) {
            let emojiHtml = '';
            if (customStatus.emoji) {
                if (customStatus.emoji.id) {
                    emojiHtml = `<img src="https://cdn.discordapp.com/emojis/${customStatus.emoji.id}.${customStatus.emoji.animated?'gif':'png'}" alt="Emoji">`;
                } else {
                    emojiHtml = `<span>${customStatus.emoji.name}</span>`;
                }
            }
            customStatusHeader.innerHTML = `${emojiHtml}<span>${customStatus.state || ''}</span>`;
            customStatusHeader.style.display = 'inline-flex';
        } else {
            customStatusHeader.style.display = 'none';
        }
    }
    
    if (statusTag) {
        let tagText = "";
        
        // Priority 1: Official Discord Clan Tag Only
        if (data.discord_user && data.discord_user.clan) {
            const clan = data.discord_user.clan;
            tagText = clan.tag;
            statusTag.innerHTML = `<i class="fa-solid fa-crosshairs anim-glow" style="font-size: 0.8em; margin-right: 4px;"></i>${tagText.toUpperCase()}`;
        } else {
            // Priority 2: Extract tags like [TAG] or |TAG| from Global Name
            const tagMatch = globalName.match(/[\[\(\{\|\/]([^\]\)\}\|\/\s]{2,12})[\]\)\}\|\/]/);
            if (tagMatch) tagText = tagMatch[1];
            if (tagText) statusTag.innerText = tagText.toUpperCase();
        }
        
        if (tagText) {
            statusTag.style.display = 'inline-block';
            console.log('Applied Discord Tag:', tagText);
        } else {
            statusTag.style.display = 'none';
        }
    }
    
    // Update Avatars
    const avatarHash = data.discord_user.avatar;
    if (avatarHash) {
        const avatarUrl = `https://cdn.discordapp.com/avatars/${data.discord_user.id}/${avatarHash}.png?size=1024&v=${Date.now()}`;
        if (mainAvatar) mainAvatar.src = avatarUrl;
        if (miniAvatar) miniAvatar.src = avatarUrl;
    }

    // Update Avatar Decoration
    const decoration = data.discord_user.avatar_decoration;
    const decoImg = document.querySelector('.avatar-decoration');
    if (decoImg) {
        if (decoration) {
            decoImg.src = `https://cdn.discordapp.com/avatar-decorations/${data.discord_user.id}/${decoration}.png?size=240`;
            decoImg.style.display = 'block';
        } else {
            decoImg.style.display = 'none';
        }
    }

    // Update Status Colors
    const statusColors = { online: '#23a55a', idle: '#f0b232', dnd: '#f23f43', offline: '#80848e' };
    const color = statusColors[data.discord_status] || statusColors.offline;
    
    if (statusIndicator) statusIndicator.style.background = color;
    if (miniStatus) miniStatus.style.background = color;

    // Update Voice Status (Broader check)
    const isInVoice = data.activities.some(a => 
        (a.name && (a.name.toLowerCase().includes('voice') || a.name.toLowerCase().includes('channel') || a.name.toLowerCase() === 'discord')) || 
        (a.state && (a.state.toLowerCase().includes('voice') || a.state.toLowerCase().includes('joined'))) ||
        (a.details && (a.details.toLowerCase().includes('voice')))
    );
    
    if (voiceDetails) voiceDetails.style.display = isInVoice ? 'flex' : 'none';
    
    const voiceLiveIndicator = document.querySelector('.voice-live-indicator');
    if (voiceLiveIndicator) voiceLiveIndicator.style.display = isInVoice ? 'flex' : 'none';

    // Update Spotify Display
    const spotifyDetails = document.querySelector('.spotify-details');
    const isListeningSpotify = data.listening_to_spotify && data.discord_status !== 'offline';
    if (spotifyDetails) spotifyDetails.style.display = isListeningSpotify ? 'flex' : 'none';

    if (isListeningSpotify) {
        if (spotifyCover) spotifyCover.src = data.spotify.album_art_url;
        if (spotifySong) spotifySong.innerText = data.spotify.song;
        if (spotifyArtist) spotifyArtist.innerText = data.spotify.artist;
    }

    // Update General Activity (Games/Apps List)
    const activityDetails = document.querySelector('.activity-details');
    const otherActivities = data.activities.filter(a => 
        a.type !== 4 && 
        a.name !== 'Spotify' && 
        !a.name.toLowerCase().includes('voice') &&
        a.name !== 'Hang Status'
    );
    
    if (activityDetails) {
        if (otherActivities.length > 0) {
            activityDetails.style.display = 'flex';
            
            // Generate HTML for all activities
            const activitiesHTML = otherActivities.map(activity => {
                let iconUrl = 'https://upload.wikimedia.org/wikipedia/commons/7/74/Discord_Logo_Blurple.svg';
                
                // Override for Steam/Photoshop
                if (activity.name.toLowerCase() === 'steam') {
                    iconUrl = 'https://upload.wikimedia.org/wikipedia/commons/8/83/Steam_icon_logo.svg';
                } else if (activity.name.toLowerCase().includes('photoshop')) {
                    iconUrl = 'https://upload.wikimedia.org/wikipedia/commons/a/af/Adobe_Photoshop_CC_icon.svg';
                } else if (activity.assets && activity.assets.large_image) {
                    if (activity.assets.large_image.startsWith('mp:external')) {
                        iconUrl = activity.assets.large_image.replace(/mp:external\/.*\/(https?)/, '$1');
                    } else {
                        iconUrl = `https://cdn.discordapp.com/app-assets/${activity.application_id}/${activity.assets.large_image}.png`;
                    }
                }
                
                return `
                    <div class="activity-item">
                        <div class="activity-icon-container">
                            <img class="activity-icon" src="${iconUrl}" alt="${activity.name}">
                        </div>
                        <div class="activity-info">
                            <span class="activity-name">${activity.name}</span>
                            <span class="activity-state">${activity.details || activity.state || 'Active'}</span>
                            <div class="status-dot"></div>
                        </div>
                    </div>
                `;
            }).join('');
            
            activityDetails.innerHTML = activitiesHTML;
        } else {
            activityDetails.style.display = 'none';
        }

        // Update status text based on priority: 1. Spotify, 2. Custom Status, 3. Game/Activity, 4. Online/Offline
        if (isListeningSpotify) {
            if (statusText) statusText.innerHTML = `<i class="fa-brands fa-spotify" style="color:#1DB954; margin-right: 8px;"></i> Listening to ${data.spotify.song}`;
        } else {
            const customStatus = data.activities.find(a => a.type === 4);
            if (customStatus) {
                let emojiStr = '';
                if (customStatus.emoji) {
                    if (customStatus.emoji.id) {
                        emojiStr = `<img class="status-emoji" src="https://cdn.discordapp.com/emojis/${customStatus.emoji.id}.${customStatus.emoji.animated?'gif':'png'}" style="width:1.2rem; vertical-align:middle; margin-right:5px;">`;
                    } else {
                        emojiStr = `<span style="margin-right:5px;">${customStatus.emoji.name}</span>`;
                    }
                }
                if (statusText) statusText.innerHTML = `${emojiStr}${customStatus.state || ''}`;
            } else if (otherActivities.length > 0) {
                if (statusText) statusText.innerText = `Playing ${otherActivities[0].name}${otherActivities.length > 1 ? ' & others' : ''}`;
            } else {
                if (statusText) statusText.innerText = data.discord_status === 'offline' ? 'Offline' : 'AFK................???';
            }
        }
    }





    // DIAGNOSTIC LOG (F12 Console):
    console.log('--- Lanyard Presence Data ---');
    console.log('User Data:', data.discord_user);
    console.log('Clan Data:', data.discord_user.clan);
    console.log('Spotify:', data.listening_to_spotify);
    console.log('Activities:', otherActivities.map(a => a.name));
}

// Initial fetch and interval (Faster: 3 seconds)
fetchDiscordStatus();
setInterval(fetchDiscordStatus, 3000);

// Friend Request Button Logic
const addFriendBtn = document.getElementById('add-friend-btn');
const copySuccessMsg = document.getElementById('copy-success-msg');

if (addFriendBtn) {
    addFriendBtn.addEventListener('click', () => {
        // Fallback: Copy Discord ID to clipboard
        const discordId = localStorage.getItem('discord_id') || DISCORD_ID;
        navigator.clipboard.writeText(discordId).then(() => {
            if (copySuccessMsg) {
                copySuccessMsg.style.display = 'block';
                addFriendBtn.innerHTML = '<i class="fa-solid fa-check"></i> <span>Friend Request Send</span>';
                
                setTimeout(() => {
                    copySuccessMsg.style.display = 'none';
                    addFriendBtn.innerHTML = '<i class="fa-solid fa-user-plus"></i> <span>Add Friend</span>';
                }, 3000);
            }
        });
        
        // Change indicator color
        addFriendBtn.classList.add('clicked');
        
        // Also open Discord user link
        window.open(`https://discord.com/users/${discordId}`, '_blank');
    });
}

// Toggle Spotify Poster on Click
if (statusCard) {
    statusCard.addEventListener('click', () => {
        statusCard.classList.toggle('show-poster');
    });
}

