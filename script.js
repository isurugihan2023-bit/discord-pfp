
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

// Music Player Implementation
function initMusicPlayer() {
    const music = document.getElementById('bg-music');
    const toggleBtn = document.getElementById('music-toggle');
    const icon = toggleBtn.querySelector('i');
    
    const sliderRoot = document.getElementById('volume-slider');
    const sliderRange = document.querySelector('.slider-range');
    const sliderTrackWrapper = document.querySelector('.slider-track-wrapper');
    const volumeValueText = document.getElementById('volume-value');
    const volumeIcons = document.querySelectorAll('.volume-icon');

    if (!music || !toggleBtn || !sliderRoot) return;

    let isPlaying = true;
    let volume = 60; // default 60% <!-- unmuted and 60% volume -->
    const MAX_OVERFLOW = 50;

    // Decay function for elastic effect
    const decay = (value, max) => {
        if (max === 0) return 0;
        const entry = value / max;
        const sigmoid = 2 * (1 / (1 + Math.exp(-entry)) - 0.5);
        return sigmoid * max;
    };

    const updateUI = (overflow = 0, region = 'middle') => {
        // Update volume on audio element
        music.volume = volume / 100;
        
        // Update range bar width
        sliderRange.style.width = `${volume}%`;
        
        // Update text indicator
        volumeValueText.textContent = Math.round(volume);

        // Apply elastic stretch
        const trackWidth = sliderRoot.offsetWidth;
        const scaleX = 1 + overflow / trackWidth;
        const scaleY = 1 - (overflow / MAX_OVERFLOW) * 0.2;
        
        sliderTrackWrapper.style.transform = `scaleX(${scaleX}) scaleY(${scaleY})`;
        sliderTrackWrapper.style.transformOrigin = region === 'left' ? 'right' : 'left';

        // Animate icons based on region
        volumeIcons[0].style.transform = region === 'left' ? `scale(${1 + (overflow / MAX_OVERFLOW) * 0.4}) translateX(${-overflow * 0.5}px)` : 'scale(1) translateX(0)';
        volumeIcons[1].style.transform = region === 'right' ? `scale(${1 + (overflow / MAX_OVERFLOW) * 0.4}) translateX(${overflow * 0.5}px)` : 'scale(1) translateX(0)';
    };

    // Initialize UI
    updateUI();
    
    // Set initial playing state for icons
    icon.className = 'fas fa-volume-up';
    toggleBtn.classList.add('playing');
    
    // Attempt auto-play on load (Note: may still be blocked by browser until first interaction)
    music.play().catch(err => {
        console.log("Auto-play blocked, waiting for interaction.");
        isPlaying = false; // reset state if blocked
        icon.className = 'fas fa-volume-mute';
        toggleBtn.classList.remove('playing');
    });

    const startMusic = () => {
        if (!isPlaying) {
            music.play().then(() => {
                isPlaying = true;
                icon.className = 'fas fa-volume-up';
                toggleBtn.classList.add('playing');
                updateUI();
            }).catch(err => console.log("Playback failed on interaction:", err));
            // Remove listeners once tried
            document.removeEventListener('click', startMusic);
            document.removeEventListener('keydown', startMusic);
        }
    };

    toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent the global listener from firing
        if (isPlaying) {
            music.pause();
            icon.className = 'fas fa-volume-mute';
            toggleBtn.classList.remove('playing');
        } else {
            music.play().then(() => {
                icon.className = 'fas fa-volume-up';
                toggleBtn.classList.add('playing');
            }).catch(err => console.error("Playback failed:", err));
        }
        isPlaying = !isPlaying;
    });

    // Aggressive auto-play on any interaction
    document.addEventListener('click', startMusic);
    document.addEventListener('keydown', startMusic);

    // Slider Logic
    let isDragging = false;

    const handlePointerMove = (e) => {
        if (!isDragging) return;
        
        const rect = sliderRoot.getBoundingClientRect();
        const mouseX = e.clientX;
        let overflowValue = 0;
        let region = 'middle';

        // Calculate new volume based on mouse position
        let newVolume = ((mouseX - rect.left) / rect.width) * 100;
        
        if (mouseX < rect.left) {
            region = 'left';
            overflowValue = decay(rect.left - mouseX, MAX_OVERFLOW);
            newVolume = 0;
        } else if (mouseX > rect.right) {
            region = 'right';
            overflowValue = decay(mouseX - rect.right, MAX_OVERFLOW);
            newVolume = 100;
        } else {
            newVolume = Math.min(Math.max(newVolume, 0), 100);
        }

        volume = newVolume;
        updateUI(overflowValue, region);
    };

    sliderRoot.addEventListener('pointerdown', (e) => {
        isDragging = true;
        sliderRoot.setPointerCapture(e.pointerId);
        sliderTrackWrapper.style.transition = 'none';
        volumeIcons.forEach(i => i.style.transition = 'none');
        handlePointerMove(e);
    });

    window.addEventListener('pointermove', handlePointerMove);

    window.addEventListener('pointerup', () => {
        if (!isDragging) return;
        isDragging = false;
        
        // Snap back animation
        sliderTrackWrapper.style.transition = 'transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        volumeIcons.forEach(i => i.style.transition = 'transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)');
        updateUI(0, 'middle');
    });
}

// Initialize all components
document.addEventListener('DOMContentLoaded', () => {
    initMusicPlayer();
    fetchDiscordStatus();
    setInterval(fetchDiscordStatus, 3000);
});

