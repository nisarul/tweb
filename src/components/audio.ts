/*
 * https://github.com/morethanwords/tweb
 * Copyright (C) 2019-2021 Eduard Kuzmenko
 * https://github.com/morethanwords/tweb/blob/master/LICENSE
 */

import appDocsManager, {MyDocument} from "../lib/appManagers/appDocsManager";
import { RichTextProcessor } from "../lib/richtextprocessor";
import { formatDate, wrapPhoto } from "./wrappers";
import ProgressivePreloader from "./preloader";
import { MediaProgressLine } from "../lib/mediaPlayer";
import appMediaPlaybackController, { MediaItem } from "./appMediaPlaybackController";
import { DocumentAttribute } from "../layer";
import mediaSizes from "../helpers/mediaSizes";
import { IS_SAFARI } from "../environment/userAgent";
import appMessagesManager from "../lib/appManagers/appMessagesManager";
import rootScope from "../lib/rootScope";
import './middleEllipsis';
import { SearchSuperContext } from "./appSearchSuper.";
import { formatDateAccordingToToday } from "../helpers/date";
import { cancelEvent } from "../helpers/dom/cancelEvent";
import { attachClickEvent, detachClickEvent } from "../helpers/dom/clickEvent";
import LazyLoadQueue from "./lazyLoadQueue";
import { CancellablePromise, deferredPromise } from "../helpers/cancellablePromise";
import ListenerSetter, { Listener } from "../helpers/listenerSetter";
import noop from "../helpers/noop";
import findUpClassName from "../helpers/dom/findUpClassName";

rootScope.addEventListener('messages_media_read', ({mids, peerId}) => {
  mids.forEach(mid => {
    (Array.from(document.querySelectorAll('audio-element[data-mid="' + mid + '"][data-peer-id="' + peerId + '"].is-unread')) as AudioElement[]).forEach(elem => {
      elem.classList.remove('is-unread');
    });
  });
});

// https://github.com/LonamiWebs/Telethon/blob/4393ec0b83d511b6a20d8a20334138730f084375/telethon/utils.py#L1285
export function decodeWaveform(waveform: Uint8Array | number[]) {
  if(!(waveform instanceof Uint8Array)) {
    waveform = new Uint8Array(waveform);
  }

  const bitCount = waveform.length * 8;
  const valueCount = bitCount / 5 | 0;
  if(!valueCount) {
    return new Uint8Array([]);
  }

  let result: Uint8Array;
  try {
    const dataView = new DataView(waveform.buffer);
    result = new Uint8Array(valueCount);
    for(let i = 0; i < valueCount; i++) {
      const byteIndex = i * 5 / 8 | 0;
      const bitShift = i * 5 % 8;
      const value = dataView.getUint16(byteIndex, true);
      result[i] = (value >> bitShift) & 0b00011111;
    }
  } catch(err) {
    result = new Uint8Array([]);
  }

  /* var byteIndex = (valueCount - 1) / 8 | 0;
  var bitShift = (valueCount - 1) % 8;
  if(byteIndex === waveform.length - 1) {
    var value = waveform[byteIndex];
  } else {
    var value = dataView.getUint16(byteIndex, true);
  }
  console.log('decoded waveform, setting last value:', value, byteIndex, bitShift);
  result[valueCount - 1] = (value >> bitShift) & 0b00011111; */
  return result;
}

function wrapVoiceMessage(audioEl: AudioElement) {
  audioEl.classList.add('is-voice');

  const message = audioEl.message;
  const doc = (message.media.document || message.media.webpage.document) as MyDocument;
  const isOut = message.fromId === rootScope.myId && message.peerId !== rootScope.myId;
  let isUnread = message && message.pFlags.media_unread;
  if(isUnread) {
    audioEl.classList.add('is-unread');
  }

  if(message.pFlags.out) {
    audioEl.classList.add('is-out');
  }

  const barWidth = 2;
  const barMargin = 2;      //mediaSizes.isMobile ? 2 : 1;
  const barHeightMin = 4;   //mediaSizes.isMobile ? 3 : 2;
  const barHeightMax = mediaSizes.isMobile ? 16 : 23;
  const availW = 150;       //mediaSizes.isMobile ? 152 : 190;

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.classList.add('audio-waveform');
  svg.setAttributeNS(null, 'width', '' + availW);
  svg.setAttributeNS(null, 'height', '' + barHeightMax);
  svg.setAttributeNS(null, 'viewBox', `0 0 ${availW} ${barHeightMax}`);

  const timeDiv = document.createElement('div');
  timeDiv.classList.add('audio-time');
  audioEl.append(svg, timeDiv);

  let waveform = (doc.attributes.find(attribute => attribute._ === 'documentAttributeAudio') as DocumentAttribute.documentAttributeAudio).waveform || new Uint8Array([]);
  waveform = decodeWaveform(waveform.slice(0, 63));

  //console.log('decoded waveform:', waveform);

  const normValue = Math.max(...waveform);
  const wfSize = waveform.length ? waveform.length : 100;
  const barCount = Math.min((availW / (barWidth + barMargin)) | 0, wfSize);

  let maxValue = 0;
  const maxDelta = barHeightMax - barHeightMin;

  let html = '';
  for(let i = 0, barX = 0, sumI = 0; i < wfSize; ++i) {
    const value = waveform[i] || 0;
    if((sumI + barCount) >= wfSize) { // draw bar
      sumI = sumI + barCount - wfSize;
			if(sumI < (barCount + 1) / 2) {
				if(maxValue < value) maxValue = value;
      }
      
      const bar_value = Math.max(((maxValue * maxDelta) + ((normValue + 1) / 2)) / (normValue + 1), barHeightMin);
      
      const h = `
      <rect x="${barX}" y="${barHeightMax - bar_value}" width="${barWidth}" height="${bar_value}" rx="1" ry="1"></rect>
      `;
      html += h;

      barX += barWidth + barMargin;

      if(sumI < (barCount + 1) / 2) {
        maxValue = 0;
      } else {
        maxValue = value;
      }
    } else {
      if(maxValue < value) maxValue = value;

      sumI += barCount;
    }
  }

  svg.insertAdjacentHTML('beforeend', html);
  const rects = Array.from(svg.children) as HTMLElement[];

  let progress = audioEl.querySelector('.audio-waveform') as HTMLDivElement;
  
  const onLoad = () => {
    let interval = 0;
    let lastIndex = 0;

    let audio = audioEl.audio;

    if(!audio.paused || (audio.currentTime > 0 && audio.currentTime !== audio.duration)) {
      lastIndex = Math.round(audio.currentTime / audio.duration * barCount);
      rects.slice(0, lastIndex + 1).forEach(node => node.classList.add('active'));
    }

    let start = () => {
      clearInterval(interval);
      interval = window.setInterval(() => {
        if(lastIndex > svg.childElementCount || isNaN(audio.duration) || audio.paused) {
          clearInterval(interval);
          return;
        }

        lastIndex = Math.round(audio.currentTime / audio.duration * barCount);
        
        //svg.children[lastIndex].setAttributeNS(null, 'fill', '#000');
        //svg.children[lastIndex].classList.add('active'); #Иногда пропускает полоски..
        rects.slice(0, lastIndex + 1).forEach(node => node.classList.add('active'));
        //++lastIndex;
        //console.log('lastIndex:', lastIndex, audio.currentTime);
        //}, duration * 1000 / svg.childElementCount | 0/* 63 * duration / 10 */);
      }, 20);
    };

    if(!audio.paused) {
      start();
    }

    audioEl.addAudioListener('play', () => {
      if(isUnread && !isOut && audioEl.classList.contains('is-unread')) {
        audioEl.classList.remove('is-unread');
        appMessagesManager.readMessages(audioEl.message.peerId, [audioEl.message.mid]);
        isUnread = false;
      }

      //rects.forEach(node => node.classList.remove('active'));
      start();
    });

    audioEl.addAudioListener('pause', () => {
      clearInterval(interval);
    });
    
    audioEl.addAudioListener('ended', () => {
      clearInterval(interval);
      rects.forEach(node => node.classList.remove('active'));
    });
    
    let mousedown = false, mousemove = false;
    progress.addEventListener('mouseleave', (e) => {
      if(mousedown) {
        audio.play();
        mousedown = false;
      }
      mousemove = false;
    })
    progress.addEventListener('mousemove', (e) => {
      mousemove = true;
      if(mousedown) scrub(e);
    });
    progress.addEventListener('mousedown', (e) => {
      e.preventDefault();
      if(e.button !== 1) return;
      if(!audio.paused) {
        audio.pause();
      }
      
      scrub(e);
      mousedown = true;
    });
    progress.addEventListener('mouseup', (e) => {
      if (mousemove && mousedown) {
        audio.play();
        mousedown = false;
      }
    });
    attachClickEvent(progress, (e) => {
      cancelEvent(e);
      if(!audio.paused) scrub(e);
    });
    
    function scrub(e: MouseEvent | TouchEvent) {
      let offsetX: number;
      if(e instanceof MouseEvent) {
        offsetX = e.offsetX;
      } else { // touch
        const rect = (e.target as HTMLElement).getBoundingClientRect();
        offsetX = e.targetTouches[0].pageX - rect.left;
      }
      
      const scrubTime = offsetX / availW /* width */ * audio.duration;
      lastIndex = Math.round(scrubTime / audio.duration * barCount);
      
      rects.slice(0, lastIndex + 1).forEach(node => node.classList.add('active'));
      for(let i = lastIndex + 1; i < rects.length; ++i) {
        rects[i].classList.remove('active')
      }
      audio.currentTime = scrubTime;
    }
    
    return () => {
      clearInterval(interval);
      progress.remove();
      progress = null;
      audio = null;
    };
  };

  return onLoad;
}

function wrapAudio(audioEl: AudioElement) {
  const withTime = audioEl.withTime;

  const message = audioEl.message;
  const doc: MyDocument = message.media.document || message.media.webpage.document;

  const senderTitle = audioEl.showSender ? appMessagesManager.getSenderToPeerText(message) : '';

  let title = doc.type === 'voice' ? senderTitle : (doc.audioTitle || doc.fileName);
  let subtitle: string;
  
  if(doc.type === 'voice') {
    subtitle = '';
  } else {
    subtitle = doc.audioPerformer ? RichTextProcessor.wrapPlainText(doc.audioPerformer) : '';
    if(withTime) {
      subtitle += (subtitle ? ' • ' : '') + formatDate(doc.date);
    } else if(!subtitle) {
      subtitle = 'Unknown Artist';
    }

    if(audioEl.showSender) {
      subtitle += ' • ' + senderTitle;
    } else {
      subtitle = ' • ' + subtitle;
    }
  }

  let titleAdditionHTML = '';
  if(audioEl.showSender) {
    titleAdditionHTML = `<div class="sent-time">${formatDateAccordingToToday(new Date(message.date * 1000))}</div>`;
  }

  const html = `
  <div class="audio-details">
    <div class="audio-title"><middle-ellipsis-element data-font-weight="${audioEl.dataset.fontWeight}">${title}</middle-ellipsis-element>${titleAdditionHTML}</div>
    <div class="audio-subtitle"><div class="audio-time"></div>${subtitle || '<div></div>'}</div>
  </div>`;
  
  audioEl.insertAdjacentHTML('beforeend', html);

  const onLoad = () => {
    const subtitleDiv = audioEl.querySelector('.audio-subtitle') as HTMLDivElement;
    let launched = false;

    let progressLine = new MediaProgressLine(audioEl.audio, doc.supportsStreaming);

    audioEl.addAudioListener('ended', () => {
      audioEl.classList.remove('audio-show-progress');
      // Reset subtitle
      subtitleDiv.lastChild.replaceWith(subtitle);
      launched = false;
    });

    const onPlay = () => {
      if(!launched) {
        audioEl.classList.add('audio-show-progress');
        launched = true;

        if(progressLine) {
          subtitleDiv.lastChild.replaceWith(progressLine.container);
        }
      }
    };

    audioEl.addAudioListener('play', onPlay);

    if(!audioEl.audio.paused || audioEl.audio.currentTime > 0) {
      onPlay();
    }

    return () => {
      progressLine.removeListeners();
      progressLine.container.remove();
      progressLine = null;
    };
  };

  return onLoad;
}

function constructDownloadPreloader(tryAgainOnFail = true) {
  const preloader = new ProgressivePreloader({cancelable: true, tryAgainOnFail});
  preloader.construct();
  preloader.circle.setAttributeNS(null, 'r', '23');
  preloader.totalLength = 143.58203125;

  return preloader;
}

export default class AudioElement extends HTMLElement {
  public audio: HTMLAudioElement;
  public preloader: ProgressivePreloader;
  public message: any;
  public withTime = false;
  public voiceAsMusic = false;
  public searchContext: SearchSuperContext;
  public showSender = false;
  public noAutoDownload: boolean;
  public lazyLoadQueue: LazyLoadQueue;
  public loadPromises: Promise<any>[];

  private listenerSetter = new ListenerSetter();
  private onTypeDisconnect: () => void;
  public onLoad: (autoload?: boolean) => void;
  private readyPromise: CancellablePromise<void>;

  public render() {
    this.classList.add('audio');

    const doc: MyDocument = this.message.media.document || this.message.media.webpage.document;
    const isRealVoice = doc.type === 'voice';
    const isVoice = !this.voiceAsMusic && isRealVoice;
    const isOutgoing = this.message.pFlags.is_outgoing;
    const uploading = isOutgoing && this.preloader;

    const durationStr = String(doc.duration | 0).toHHMMSS();

    this.innerHTML = `
    <div class="audio-toggle audio-ico">
      <div class="audio-play-icon">
        <div class="part one" x="0" y="0" fill="#fff"></div>
        <div class="part two" x="0" y="0" fill="#fff"></div>
      </div>
    </div>`;

    const toggle = this.firstElementChild as HTMLElement;

    const downloadDiv = document.createElement('div');
    downloadDiv.classList.add('audio-download');

    if(uploading) {
      this.classList.add('is-outgoing');
      this.append(downloadDiv);
    }

    const onTypeLoad = isVoice ? wrapVoiceMessage(this) : wrapAudio(this);
    
    const audioTimeDiv = this.querySelector('.audio-time') as HTMLDivElement;
    audioTimeDiv.innerHTML = durationStr;

    const onLoad = this.onLoad = (autoload = true) => {
      this.onLoad = undefined;

      const audio = this.audio = appMediaPlaybackController.addMedia(this.message.peerId, this.message.media.document || this.message.media.webpage.document, this.message.mid, autoload);

      this.onTypeDisconnect = onTypeLoad();
      
      const getTimeStr = () => String(audio.currentTime | 0).toHHMMSS() + (isVoice ? (' / ' + durationStr) : '');

      const onPlay = () => {
        audioTimeDiv.innerText = getTimeStr();
        toggle.classList.toggle('playing', !audio.paused);
      };

      if(!audio.paused || (audio.currentTime > 0 && audio.currentTime !== audio.duration)) {
        onPlay();
      }

      const togglePlay = (e?: Event, paused = audio.paused) => {
        e && cancelEvent(e);

        if(paused) {
          if(appMediaPlaybackController.setSearchContext(this.searchContext)) {
            let prev: MediaItem[], next: MediaItem[];
            const container = findUpClassName(this, this.classList.contains('search-super-item') ? 'tabs-tab' : 'bubbles-inner');
            if(container) {
              const elements = Array.from(container.querySelectorAll('.audio' + (isVoice ? '.is-voice' : ''))) as AudioElement[];
              const idx = elements.indexOf(this);

              const mediaItems: MediaItem[] = elements.map(element => ({peerId: +element.dataset.peerId, mid: +element.dataset.mid}));

              prev = mediaItems.slice(0, idx);
              next = mediaItems.slice(idx + 1);
            }

            appMediaPlaybackController.setTargets({peerId: this.message.peerId, mid: this.message.mid}, prev, next);
          }

          audio.play().catch(() => {});
        } else {
          audio.pause();
        }
      };

      attachClickEvent(toggle, (e) => togglePlay(e), {listenerSetter: this.listenerSetter});

      this.addAudioListener('ended', () => {
        toggle.classList.remove('playing');
        audioTimeDiv.innerText = durationStr;
      });

      this.addAudioListener('timeupdate', () => {
        if((!audio.currentTime && audio.paused) || appMediaPlaybackController.isSafariBuffering(audio)) return;
        audioTimeDiv.innerText = getTimeStr();
      });

      this.addAudioListener('pause', () => {
        toggle.classList.remove('playing');
      });

      this.addAudioListener('play', onPlay);

      return togglePlay;
    };

    if(!isOutgoing) {
      let preloader: ProgressivePreloader = this.preloader;

      const getDownloadPromise = () => appDocsManager.downloadDoc(doc);

      if(isRealVoice) {
        if(!preloader) {
          preloader = constructDownloadPreloader();
        }

        const load = () => {
          const download = getDownloadPromise();
          preloader.attach(downloadDiv, false, download);

          if(!downloadDiv.parentElement) {
            this.append(downloadDiv);
          }

          (download as Promise<any>).then(() => {
            detachClickEvent(this, onClick);
            onLoad();

            downloadDiv.classList.add('downloaded');
            setTimeout(() => {
              downloadDiv.remove();
            }, 200);
          });

          return {download};
        };

        // preloader.construct();
        preloader.setManual();
        preloader.attach(downloadDiv);
        preloader.setDownloadFunction(load);

        const onClick = (e?: Event) => {
          preloader.onClick(e);
        };
    
        attachClickEvent(this, onClick);

        if(!this.noAutoDownload) {
          onClick();
        }
      } else {
        if(doc.supportsStreaming) {
          onLoad(false);
        }

        if(doc.thumbs) {
          const imgs: HTMLImageElement[] = [];
          const wrapped = wrapPhoto({
            photo: doc, 
            message: null, 
            container: toggle, 
            boxWidth: 48, 
            boxHeight: 48,
            loadPromises: this.loadPromises,
            withoutPreloader: true,
            lazyLoadQueue: this.lazyLoadQueue
          });
          toggle.style.width = toggle.style.height = '';
          if(wrapped.images.thumb) imgs.push(wrapped.images.thumb);
          if(wrapped.images.full) imgs.push(wrapped.images.full);

          this.classList.add('audio-with-thumb');
          imgs.forEach(img => img.classList.add('audio-thumb'));
        }

        //if(appMediaPlaybackController.mediaExists(mid)) { // чтобы показать прогресс, если аудио уже было скачано
          //onLoad();
        //} else {
          const r = (e: Event) => {
            if(!this.audio) {
              const togglePlay = onLoad(false);
            }

            if(this.audio.src) {
              return;
            }
            
            appMediaPlaybackController.resolveWaitingForLoadMedia(this.message.peerId, this.message.mid);
            appMediaPlaybackController.willBePlayed(this.audio); // prepare for loading audio

            if(IS_SAFARI) {
              this.audio.autoplay = true;
            }

            // togglePlay(undefined, true);

            this.readyPromise = deferredPromise<void>();
            if(this.audio.readyState >= 2) this.readyPromise.resolve();
            else {
              this.addAudioListener('canplay', () => this.readyPromise.resolve(), {once: true});
            }

            if(!preloader) {
              if(doc.supportsStreaming) {
                this.classList.add('corner-download');

                let pauseListener: Listener;
                const onPlay = () => {
                  const preloader = constructDownloadPreloader(false);
                  const deferred = deferredPromise<void>();
                  deferred.notifyAll({done: 75, total: 100});
                  deferred.catch(() => {
                    this.audio.pause();
                    appMediaPlaybackController.willBePlayed(undefined);
                  });
                  deferred.cancel = () => {
                    deferred.cancel = noop;
                    const err = new Error();
                    (err as any).type = 'CANCELED';
                    deferred.reject(err);
                  };
                  preloader.attach(downloadDiv, false, deferred);

                  pauseListener = this.addAudioListener('pause', () => {
                    deferred.cancel();
                  }, {once: true}) as any;
                };

                /* if(!this.audio.paused) {
                  onPlay();
                } */

                const playListener: any = this.addAudioListener('play', onPlay);
                this.readyPromise.then(() => {
                  this.listenerSetter.remove(playListener);
                  this.listenerSetter.remove(pauseListener);
                });
              } else {
                const load = () => {
                  const download = getDownloadPromise();
                  preloader.attach(downloadDiv, false, download);
                  return {download};
                };

                preloader.setDownloadFunction(load);
                load();
              }
            }

            this.append(downloadDiv);

            this.readyPromise.then(() => {
              downloadDiv.classList.add('downloaded');
              setTimeout(() => {
                downloadDiv.remove();
              }, 200);
  
              //setTimeout(() => {
                // release loaded audio
                if(appMediaPlaybackController.willBePlayedMedia === this.audio) {
                  this.audio.play();
                  appMediaPlaybackController.willBePlayed(undefined);
                }
              //}, 10e3);
            });
          };

          if(!this.audio?.src) {
            attachClickEvent(toggle, r, {once: true, capture: true, passive: false});
          }
        //}
      }
    } else if(uploading) {
      this.preloader.attach(downloadDiv, false);
      //onLoad();
    }
  }

  get addAudioListener() {
    return this.listenerSetter.add(this.audio);
  }

  disconnectedCallback() {
    if(this.isConnected) {
      return;
    }
    
    if(this.onTypeDisconnect) {
      this.onTypeDisconnect();
      this.onTypeDisconnect = null;
    }

    if(this.readyPromise) {
      this.readyPromise.reject();
    }

    this.listenerSetter.removeAll();
    this.listenerSetter = null;

    this.preloader = null;
  }
}

customElements.define("audio-element", AudioElement);
