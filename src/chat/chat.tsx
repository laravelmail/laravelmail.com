import { Component, type RenderableProps } from "preact";
import MessageArea from "./message-area";
import { botman } from "./botman";
import type { IMessage, IConfiguration, IFileAttachment } from "../typings";

enum ReplyType {
    Text = "text",
    TextArea = "textarea"
}

interface IChatProps {
    userId: string;
    conf: IConfiguration;
}

declare global {
    interface Window {
        botmanChatWidget: any;
        THREE: any;
    }
}

interface IChatState {
    messages: IMessage[];
    replyType: ReplyType;
    fileAttachment: IFileAttachment | null;
    isDragOver: boolean;
    isUploading: boolean;
    vrmLoaded: boolean;
    vrmReady: boolean;
    isSpeaking: boolean;
    isVrmEnlarged: boolean;
    darkMode: boolean;
    isMinimized: boolean;
}

class VRMSmoothLookAt {
    smoothFactor: number = 10.0;
    yawLimit: number = 45.0;
    pitchLimit: number = 45.0;
    _yawDamped: number = 0.0;
    _pitchDamped: number = 0.0;
    _yaw: number = 0.0;
    _pitch: number = 0.0;
    _needsUpdate: boolean = false;
    target: any = null;
    autoUpdate: boolean = true;
    applier: any;
    humanoid: any;

    constructor(humanoid: any, applier: any) {
        this.humanoid = humanoid;
        this.applier = applier;
    }

    lookAt(position: any) {
        if (!position || !this.humanoid) return;
        const humanoidPosition = this.humanoid.normalizedRestPose?.hips?.position || { x: 0, y: 1, z: 0 };
        const dx = position.x - humanoidPosition.x;
        const dy = position.y - humanoidPosition.y;
        const dz = position.z - humanoidPosition.z;
        this._yaw = Math.atan2(dx, dz) * (180 / Math.PI);
        this._pitch = Math.atan2(dy, Math.sqrt(dx * dx + dz * dz)) * (180 / Math.PI);
        this._needsUpdate = true;
    }

    update(delta: number) {
        if (this.target && this.autoUpdate) {
            let targetPos;
            if (typeof this.target.getWorldPosition === 'function') {
                const THREE = (window as any).THREE;
                if (THREE && THREE.Vector3) {
                    const vec = new THREE.Vector3();
                    this.target.getWorldPosition(vec);
                    targetPos = vec;
                } else {
                    targetPos = this.target.position || { x: 0, y: 1, z: 5 };
                }
            } else {
                targetPos = this.target.position || { x: 0, y: 1, z: 5 };
            }
            this.lookAt(targetPos);
            if (Math.abs(this._yaw) > this.yawLimit || Math.abs(this._pitch) > this.pitchLimit) {
                this._yaw = 0.0;
                this._pitch = 0.0;
            }
            const k = 1.0 - Math.exp(-this.smoothFactor * delta);
            this._yawDamped += (this._yaw - this._yawDamped) * k;
            this._pitchDamped += (this._pitch - this._pitchDamped) * k;
            if (this.applier && typeof this.applier.applyYawPitch === 'function') {
                this.applier.applyYawPitch(this._yawDamped, this._pitchDamped);
            }
            this._needsUpdate = false;
        }
        if (this._needsUpdate) {
            this._needsUpdate = false;
            if (this.applier && typeof this.applier.applyYawPitch === 'function') {
                this.applier.applyYawPitch(this._yaw, this._pitch);
            }
        }
    }
}

export default class Chat extends Component<IChatProps, IChatState> {
    private botman: any;
    private inputRef!: HTMLInputElement;
    private textareaRef!: HTMLTextAreaElement;
    private fileInputRef!: HTMLInputElement;
    private messageEventHandler: (event: MessageEvent) => void;
    private vrmCanvas!: HTMLCanvasElement;
    private vrmRenderer: any;
    private vrmScene: any;
    private vrmCamera: any;
    private vrmControls: any;
    private currentVrm: any;
    private vrmClock: any;
    private animationFrameId: number | null = null;
    private vrmInitialized: boolean = false;
    private currentAudio: HTMLAudioElement | null = null;
    private isSpeaking: boolean = false;
    private vrmContainerElement: HTMLElement | null = null;
    private vrmEnlargedContainerElement: HTMLElement | null = null;
    private messageObjects: Map<string, any> = new Map();
    private textMeshes: Map<string, any> = new Map();
    private backgroundMeshes: Map<string, any> = new Map();
    private bubbleCounter: number = 0;

    constructor(props: IChatProps) {
        super(props);
        this.botman = botman;
        this.botman.setUserId(props.userId);
        this.botman.setChatServer(props.conf.chatServer);
        this.botman.setRequestHeaders(props.conf.requestHeaders);
        this.state = {
            messages: [],
            replyType: ReplyType.Text,
            fileAttachment: null,
            isDragOver: false,
            isUploading: false,
            vrmLoaded: true,
            vrmReady: false,
            isSpeaking: false,
            isVrmEnlarged: false,
            darkMode: true,
            isMinimized: false
        };
        this.messageEventHandler = this.handleMessageEvent.bind(this);
    }

    private getVRMContainer(): HTMLElement | null {
        if (this.state.isVrmEnlarged) {
            if (this.vrmEnlargedContainerElement) return this.vrmEnlargedContainerElement;
            const enlargedContainer = document.getElementById('vrm-container-enlarged');
            if (enlargedContainer) return enlargedContainer;
        }
        if (this.props.conf.useShadowDom) {
            const shadowHost = document.querySelector('botman-widget');
            if (shadowHost?.shadowRoot) {
                let container = shadowHost.shadowRoot.getElementById('vrm-container');
                if (container) return container;
            }
        }
        let container = document.getElementById('vrm-container');
        if (!container) {
            const widgetRoot = document.getElementById('botmanWidgetRoot');
            if (widgetRoot) {
                container = widgetRoot.querySelector('#vrm-container') as HTMLElement;
            }
        }
        return container;
    }

    componentDidMount(): void {
        this.setupStyles();
        this.setupMessageListener();
        this.initializeIntroMessage();
        this.setupDragAndDrop();
        if (this.props.conf.useShadowDom) {
            setTimeout(() => this.initializeVRM(), 500);
        } else {
            requestAnimationFrame(() => setTimeout(() => this.initializeVRM(), 100));
        }
    }

    componentDidUpdate(prevProps: IChatProps, prevState: IChatState): void {
        if (!this.vrmInitialized && this.state.vrmLoaded) {
            const container = this.getVRMContainer();
            if (container && !this.vrmCanvas) this.initializeVRM();
        }
        if (this.state.isVrmEnlarged !== prevState.isVrmEnlarged && this.vrmCanvas) {
            setTimeout(() => this.reattachVRMCanvas(), 50);
        }
        if (this.state.isMinimized !== prevState.isMinimized && !this.state.isMinimized && this.vrmCanvas) {
            setTimeout(() => this.reattachVRMCanvas(), 100);
        }
    }

    componentWillUnmount(): void {
        this.removeMessageListener();
        this.cleanup();
        this.removeDragAndDrop();
        this.cleanupVRM();
        this.stopSpeaking();
        this.clearMessageBubbles();
    }

    private cleanupVRM(): void {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        this.clearMessageBubbles();
        if (this.vrmScene && this.currentVrm) {
            this.vrmScene.remove(this.currentVrm.scene);
        }
        if (this.vrmRenderer) {
            this.vrmRenderer.dispose();
        }
        this.vrmInitialized = false;
    }

    private reattachVRMCanvas(): void {
        const container = this.getVRMContainer();
        if (container && this.vrmCanvas && !container.contains(this.vrmCanvas)) {
            container.appendChild(this.vrmCanvas);
            if (this.vrmRenderer) {
                const width = container.clientWidth;
                const height = container.clientHeight;
                this.vrmRenderer.setSize(width, height);
                if (this.vrmCamera) {
                    this.vrmCamera.aspect = width / height;
                    this.vrmCamera.updateProjectionMatrix();
                }
            }
        }
    }

    private vrmContainerRef = (element: HTMLDivElement | null) => {
        if (element && !this.vrmInitialized) {
            this.vrmContainerElement = element;
            setTimeout(() => { if (!this.vrmInitialized) this.initializeVRM(); }, 200);
        }
    }

    private vrmEnlargedContainerRef = (element: HTMLDivElement | null) => {
        if (element) {
            this.vrmEnlargedContainerElement = element;
        }
    }

    private async initializeVRM(): Promise<void> {
        if (this.vrmInitialized) return;
        try {
            let attempts = 0, container: HTMLElement | null = null;
            while (attempts < 50) {
                container = this.vrmContainerElement || this.getVRMContainer();
                if (container) break;
                await new Promise(resolve => setTimeout(resolve, 100));
                attempts++;
            }
            if (!container) return;
            this.vrmInitialized = true;
            this.vrmCanvas = document.createElement('canvas');
            this.vrmCanvas.id = 'vrm-canvas';
            this.vrmCanvas.style.cssText = 'width:100%;height:100%;border-radius:12px;position:relative;z-index:1;display:block;';
            container.innerHTML = '';
            container.appendChild(this.vrmCanvas);
            await new Promise(resolve => setTimeout(resolve, 50));
            await this.loadThreeJS();
        } catch (error) {
            console.error('[VRM] Failed to initialize VRM:', error);
            this.vrmInitialized = false;
        }
    }

    private async loadThreeJS(): Promise<void> {
        const existingMap = document.querySelector('script[type="importmap"]');
        if (!existingMap) {
            const script = document.createElement('script');
            script.type = 'importmap';
            script.textContent = JSON.stringify({
                imports: {
                    "three": "https://cdn.jsdelivr.net/npm/three@0.176.0/build/three.module.js",
                    "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.176.0/examples/jsm/",
                    "@pixiv/three-vrm": "https://cdn.jsdelivr.net/npm/@pixiv/three-vrm@3.1.0/lib/three-vrm.module.js"
                }
            });
            document.head.appendChild(script);
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        await this.setupVRMScene();
    }

    private async setupVRMScene(): Promise<void> {
        try {
            const THREE = await import('https://cdn.jsdelivr.net/npm/three@0.176.0/build/three.module.js');
            const { GLTFLoader } = await import('https://cdn.jsdelivr.net/npm/three@0.176.0/examples/jsm/loaders/GLTFLoader.js');
            const { OrbitControls } = await import('https://cdn.jsdelivr.net/npm/three@0.176.0/examples/jsm/controls/OrbitControls.js');
            const { VRMLoaderPlugin } = await import('https://cdn.jsdelivr.net/npm/@pixiv/three-vrm@3.1.0/lib/three-vrm.module.js');
            (window as any).THREE = THREE;
            this.vrmRenderer = new THREE.WebGLRenderer({ canvas: this.vrmCanvas, alpha: true, antialias: true });
            const container = this.getVRMContainer();
            const width = container?.clientWidth || 300, height = container?.clientHeight || 300;
            this.vrmRenderer.setSize(width, height);
            this.vrmRenderer.setPixelRatio(window.devicePixelRatio);
            this.vrmRenderer.outputColorSpace = THREE.SRGBColorSpace;
            // Explicitly set clear color to transparent
            this.vrmRenderer.setClearColor(0x000000, 0);

            this.vrmCamera = new THREE.PerspectiveCamera(30.0, width / height, 0.1, 20.0);
            this.vrmCamera.position.set(0.0, 1.0, 5.0);
            this.vrmControls = new OrbitControls(this.vrmCamera, this.vrmCanvas);
            this.vrmControls.screenSpacePanning = true;
            this.vrmControls.target.set(0.0, 1.0, 0.0);
            this.vrmControls.enableDamping = true;
            this.vrmControls.dampingFactor = 0.05;
            this.vrmControls.update();
            this.vrmScene = new THREE.Scene();

            // Ensure scene background is null for transparency
            this.vrmScene.background = null;

            this.vrmScene.add(new THREE.AmbientLight(0xffffff, 0.5));
            const directionalLight = new THREE.DirectionalLight(0xffffff, Math.PI);
            directionalLight.position.set(1.0, 1.0, 1.0).normalize();
            this.vrmScene.add(directionalLight);
            // Removed GridHelper for cleaner look
            const loader = new GLTFLoader();
            loader.crossOrigin = 'anonymous';
            loader.register((parser: any) => new VRMLoaderPlugin(parser));
            const modelUrl = this.props.conf.vrmModelUrl || 'https://pixiv.github.io/three-vrm/packages/three-vrm/examples/models/VRM1_Constraint_Twist_Sample.vrm';
            loader.load(modelUrl, (gltf: any) => {
                const vrm = gltf.userData.vrm;
                vrm.scene.traverse((obj: any) => { obj.frustumCulled = false; });
                if (vrm.humanoid) {
                    const pose = {
                        hips: { x: 0, y: 0, z: 0 },
                        spine: { x: 0, y: 0, z: 0.1 },
                        chest: { x: 0, y: 0, z: 0.15 },
                        neck: { x: 0, y: 0, z: 0 },
                        head: { x: 0, y: 0, z: 0 },
                        leftUpperArm: { x: -0.3, y: 0, z: 0.2 },
                        rightUpperArm: { x: 0.3, y: 0, z: 0.2 },
                        leftLowerArm: { x: 0, y: 0, z: 0.1 },
                        rightLowerArm: { x: 0, y: 0, z: 0.1 }
                    };
                    Object.entries(pose).forEach(([boneName, rotation]) => {
                        const bone = vrm.humanoid.getBoneNode(boneName as any);
                        if (bone) {
                            bone.rotation.set(rotation.x, rotation.y, rotation.z);
                        }
                    });
                    vrm.scene.updateMatrixWorld(true);
                }
                if (vrm.lookAt) {
                    const smoothLookAt = new VRMSmoothLookAt(vrm.humanoid, vrm.lookAt.applier);
                    Object.assign(smoothLookAt, vrm.lookAt);
                    vrm.lookAt = smoothLookAt;
                    vrm.lookAt.target = this.vrmCamera;
                }
                this.vrmScene.add(vrm.scene);
                this.currentVrm = vrm;
                this.setState({ vrmReady: true });
            }, undefined, (error: any) => console.error('[VRM] Error loading VRM:', error));
            this.vrmClock = new THREE.Clock();
            this.startVRMAnimation();
        } catch (error) {
            console.error('[VRM] Error setting up VRM scene:', error);
        }
    }

    private startVRMAnimation(): void {
        const animate = () => {
            this.animationFrameId = requestAnimationFrame(animate);
            const deltaTime = this.vrmClock?.getDelta() || 0;
            if (this.vrmControls) this.vrmControls.update();
            if (this.currentVrm) this.currentVrm.update(deltaTime);
            this.animateMessageBubbles(deltaTime);
            if (this.vrmRenderer && this.vrmScene && this.vrmCamera) {
                this.vrmRenderer.render(this.vrmScene, this.vrmCamera);
            }
        };
        animate();
    }

    private animateMessageBubbles(deltaTime: number): void {
        const THREE = (window as any).THREE;
        if (!THREE) return;

        this.messageObjects.forEach((group, id) => {
            if (group.userData.lifetime) {
                group.userData.lifetime -= deltaTime;
                if (group.userData.lifetime <= 0) {
                    this.removeMessageBubble(id);
                    return;
                }
                if (group.userData.lifetime < 2) {
                    const alpha = group.userData.lifetime / 2;
                    (group.children[0] as any).material.opacity = alpha;
                    (group.children[1] as any).material.opacity = alpha;
                }
            }
            group.position.y += deltaTime * 0.1;
        });
    }

    private createMessageBubble(message: IMessage): void {
        const THREE = (window as any).THREE;
        if (!THREE || !this.vrmScene || !message.id) return;
        if (this.messageObjects.has(message.id)) return;

        const isBot = message.from === 'chatbot';
        const text = message.text || '';
        if (!text.trim()) return;

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) return;

        const fontSize = 64;
        context.font = `${fontSize}px Arial`;
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        const padding = 32;
        const maxWidth = 512;
        const lines = this.wrapText(context, text, maxWidth - padding * 2);
        const lineHeight = fontSize * 1.2;
        const textHeight = lines.length * lineHeight;
        canvas.width = maxWidth;
        canvas.height = textHeight + padding * 2;

        // Brand Palette: #7c3aed (Purple), #ec4899 (Pink), #0f172a (Dark BG), #1e293b (Card BG)
        // Bot: Dark Card BG with Purple Border
        // User: Purple BG with Pink Border
        context.fillStyle = isBot ? 'rgba(30, 41, 59, 0.95)' : 'rgba(124, 58, 237, 0.95)';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.strokeStyle = isBot ? 'rgba(124, 58, 237, 0.8)' : 'rgba(236, 72, 153, 0.8)';
        context.lineWidth = 4;
        context.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);

        context.fillStyle = '#ffffff';
        context.font = `${fontSize}px Arial`;
        lines.forEach((line, i) => {
            context.fillText(line, canvas.width / 2, padding + i * lineHeight + fontSize / 2);
        });

        const texture = new THREE.CanvasTexture(canvas);
        texture.minFilter = THREE.LinearFilter;
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;

        const material = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            opacity: 1,
            depthWrite: false,
            side: THREE.DoubleSide
        });

        const plane = new THREE.Mesh(
            new THREE.PlaneGeometry(canvas.width / 100, canvas.height / 100),
            material
        );

        const position = isBot
            ? new THREE.Vector3(-1.0, 2.5 + this.bubbleCounter * 0.8, 1.0)
            : new THREE.Vector3(1.0, 2.5 + this.bubbleCounter * 0.8, 1.0);

        plane.position.copy(position);
        plane.lookAt(this.vrmCamera.position);

        const group = new THREE.Group();
        group.add(plane);
        group.userData = {
            lifetime: 8,
            isBot,
            id: message.id
        };

        this.vrmScene.add(group);
        this.messageObjects.set(message.id, group);
        this.bubbleCounter++;

        if (this.messageObjects.size > 5) {
            const firstId = this.messageObjects.keys().next().value;
            if (firstId) {
                setTimeout(() => this.removeMessageBubble(firstId), 500);
            }
        }
    }

    private wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
        const words = text.split(' ');
        const lines: string[] = [];
        let currentLine = words[0] || '';

        for (let i = 1; i < words.length; i++) {
            const word = words[i];
            const width = ctx.measureText(currentLine + ' ' + word).width;
            if (width < maxWidth) {
                currentLine += ' ' + word;
            } else {
                lines.push(currentLine);
                currentLine = word;
            }
        }
        lines.push(currentLine);
        return lines;
    }

    private removeMessageBubble(id: string): void {
        const group = this.messageObjects.get(id);
        if (group && this.vrmScene) {
            this.vrmScene.remove(group);
            if (group.children[0].material.map) {
                group.children[0].material.map.dispose();
            }
            group.children[0].material.dispose();
        }
        this.messageObjects.delete(id);
    }

    private clearMessageBubbles(): void {
        this.messageObjects.forEach((group, id) => {
            this.removeMessageBubble(id);
        });
        this.messageObjects.clear();
        this.bubbleCounter = 0;
    }

    private setupDragAndDrop(): void {
        const chatContainer = document.getElementById('messageArea')?.parentElement;
        if (!chatContainer) return;
        chatContainer.addEventListener('dragover', this.handleDragOver);
        chatContainer.addEventListener('dragleave', this.handleDragLeave);
        chatContainer.addEventListener('drop', this.handleDrop);
    }

    private removeDragAndDrop(): void {
        const chatContainer = document.getElementById('messageArea')?.parentElement;
        if (!chatContainer) return;
        chatContainer.removeEventListener('dragover', this.handleDragOver);
        chatContainer.removeEventListener('dragleave', this.handleDragLeave);
        chatContainer.removeEventListener('drop', this.handleDrop);
    }

    private handleDragOver = (event: DragEvent): void => {
        event.preventDefault();
        event.stopPropagation();
        this.setState({ isDragOver: true });
    }

    private handleDragLeave = (event: DragEvent): void => {
        event.preventDefault();
        event.stopPropagation();
        const rect = (event.currentTarget as Element).getBoundingClientRect();
        if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) {
            this.setState({ isDragOver: false });
        }
    }

    private handleDrop = (event: DragEvent): void => {
        event.preventDefault();
        event.stopPropagation();
        this.setState({ isDragOver: false });
        const files = event.dataTransfer?.files;
        if (files && files.length > 0) this.processSelectedFile(files[0]);
    }

    private cleanup(): void {
        if (this.fileInputRef) this.fileInputRef.value = '';
    }

    private initializeIntroMessage(): void {
        if (!this.state.messages.length && this.props.conf.introMessage) {
            this.writeToMessages({ text: this.props.conf.introMessage, type: "text", from: "chatbot" });
        }
    }

    private setupMessageListener(): void {
        const { useShadowDom, useChatAsIframe } = this.props.conf;
        try {
            if (useShadowDom && useChatAsIframe && this.isInsideIframe()) {
                window.addEventListener("message", this.messageEventHandler);
            } else if (useShadowDom && !useChatAsIframe) {
                const shadowRoot = this.getShadowRoot();
                if (shadowRoot) shadowRoot.addEventListener("message", this.messageEventHandler as any);
            } else if (useChatAsIframe && !useShadowDom && this.isInsideIframe()) {
                window.addEventListener("message", this.messageEventHandler);
            } else if (!useShadowDom && !useChatAsIframe) {
                const eventContainer = this.getEventContainer();
                if (eventContainer) eventContainer.addEventListener("message", this.messageEventHandler as any);
            }
        } catch (error) {
            console.error("Error setting up message listener:", error);
        }
    }

    private isInsideIframe(): boolean {
        return window.self !== window.top;
    }

    private getShadowRoot(): ShadowRoot | null {
        const shadowHost = document.querySelector('botman-widget');
        return shadowHost?.shadowRoot || null;
    }

    private getEventContainer(): HTMLElement | null {
        return document.getElementById('botmanWidgetRoot');
    }

    private handleMessageEvent(event: MessageEvent): void {
        const { useChatAsIframe } = this.props.conf;
        const payloadKey = useChatAsIframe ? 'data' : 'detail';
        try {
            const payload = event[payloadKey as keyof MessageEvent];
            if (!payload || typeof payload !== 'object') return;
            const { method, params } = payload;
            if (method && typeof this[method as keyof this] === 'function') {
                const methodFunction = this[method as keyof this] as Function;
                methodFunction.apply(this, Array.isArray(params) ? params : [params]);
            }
        } catch (error) {
            console.debug("Error handling message event:", error);
        }
    }

    private setupStyles(): void {
        this.applyCustomStyles();
        this.injectIframeCss();
    }

    private applyCustomStyles(): void {
        const { customStylesInjection } = this.props.conf;
        if (!customStylesInjection) return;
        const styleElement = document.createElement('style');
        styleElement.textContent = customStylesInjection.replace(/;/g, ' !important;');
        document.head.appendChild(styleElement);
    }

    private injectIframeCss(): void {
        const { useInAppCss, useChatAsIframe } = this.props.conf;
        if (!useInAppCss || !useChatAsIframe) return;
        const styleElement = document.createElement('style');
        styleElement.textContent = "";
        document.head.appendChild(styleElement);
    }

    public sayAsBot(text: string): void {
        this.writeToMessages({ text, type: "text", from: "chatbot" });
    }

    public say(text: string, showMessage: boolean = true): void {
        if (!text.trim()) return;
        const message: IMessage = { text, type: "text", from: "visitor" };
        if (this.state.fileAttachment) message.attachment = { file: this.state.fileAttachment };
        this.sendMessageToServer(message);
        if (showMessage) this.writeToMessages(message);
        this.resetFileAttachment();
        this.clearInput();
    }

    public whisper(text: string): void {
        this.say(text, false);
    }

    private sendMessageToServer(message: IMessage): void {
        this.botman.callAPI(message.text, false, message.attachment, (response: IMessage) => {
            response.from = "chatbot";
            this.writeToMessages(response);
            if (response.text) this.speakText(response.text);
        });
    }

    private async speakText(text: string): Promise<void> {
        try {
            this.stopSpeaking();
            this.setState({ isSpeaking: true });
            if ('speechSynthesis' in window) {
                await this.speakWithWebSpeechAPI(text);
            } else {
                this.setState({ isSpeaking: false });
            }
        } catch (error) {
            console.error('[TTS] Error:', error);
            this.setState({ isSpeaking: false });
        }
    }

    private speakWithWebSpeechAPI(text: string): Promise<void> {
        return new Promise((resolve, reject) => {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 1.0;
            utterance.pitch = 1.0;
            utterance.volume = 1.0;
            const voices = window.speechSynthesis.getVoices();
            const preferredVoice = voices.find(voice => voice.lang.startsWith('en-') && (voice.name.includes('Female') || voice.name.includes('Samantha')));
            if (preferredVoice) utterance.voice = preferredVoice;
            utterance.onstart = () => this.animateVRMMouth(true);
            utterance.onend = () => {
                this.setState({ isSpeaking: false });
                this.animateVRMMouth(false);
                resolve();
            };
            utterance.onerror = (event) => {
                this.setState({ isSpeaking: false });
                this.animateVRMMouth(false);
                reject(event);
            };
            window.speechSynthesis.speak(utterance);
        });
    }

    private animateVRMMouth(isOpen: boolean): void {
        if (!this.currentVrm || !this.currentVrm.expressionManager) return;
        try {
            this.currentVrm.expressionManager.setValue('aa', isOpen ? 0.5 : 0);
        } catch (error) {
            console.debug('[VRM] Expression not available');
        }
    }

    private stopSpeaking(): void {
        if ('speechSynthesis' in window) window.speechSynthesis.cancel();
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio = null;
        }
        this.setState({ isSpeaking: false });
        this.animateVRMMouth(false);
    }

    private toggleVrmEnlarge = (): void => this.setState(prevState => ({ isVrmEnlarged: !prevState.isVrmEnlarged }));
    private toggleDarkMode = (): void => this.setState(prevState => ({ darkMode: !prevState.darkMode }));
    private toggleMinimize = (): void => {
        // When minimizing, notify parent widget to close the chat
        this.setState(prevState => ({ isMinimized: !prevState.isMinimized }));

        // Trigger the parent widget to close
        if (window.botmanChatWidget && typeof window.botmanChatWidget.close === 'function') {
            window.botmanChatWidget.close();
        }
    };

    private resetFileAttachment = (): void => {
        this.setState({ fileAttachment: null, isUploading: false });
        if (this.fileInputRef) this.fileInputRef.value = '';
    }

    private clearInput(): void {
        if (this.inputRef) {
            this.inputRef.value = "";
            this.inputRef.placeholder = this.props.conf.placeholderText || "";
        }
        if (this.textareaRef) this.textareaRef.value = "";
    }

    private handleFileChange = (event: Event): void => {
        const target = event.target as HTMLInputElement;
        const file = target.files?.[0];
        if (!file) {
            this.setState({ fileAttachment: null });
            return;
        }
        this.processSelectedFile(file);
    }

    private processSelectedFile(file: File): void {
        this.setState({ isUploading: true });
        const reader = new FileReader();
        reader.onload = (event: ProgressEvent<FileReader>) => {
            const fileData: IFileAttachment = {
                name: file.name,
                type: file.type,
                size: file.size,
                data: event.target?.result || null
            };
            if (file.type.startsWith('image/')) fileData.preview = event.target?.result as string;
            this.setState({ fileAttachment: fileData, isUploading: false });
        };
        reader.onerror = () => this.setState({ fileAttachment: null, isUploading: false });
        reader.readAsDataURL(file);
    }

    private handleKeyPress = (event: KeyboardEvent): void => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            const value = this.inputRef?.value?.trim();
            if (value) this.say(value);
        }
    }

    private handleSendClick = (): void => {
        const value = this.inputRef?.value?.trim();
        if (value) this.say(value);
    }

    private removeMessageListener(): void {
        const { useShadowDom, useChatAsIframe } = this.props.conf;
        try {
            if (useChatAsIframe && !useShadowDom) {
                window.removeEventListener("message", this.messageEventHandler);
            }
            if (!useShadowDom && !useChatAsIframe) {
                const eventContainer = this.getEventContainer();
                eventContainer?.removeEventListener("message", this.messageEventHandler as any);
            }
            if (useShadowDom) {
                const shadowRoot = this.getShadowRoot();
                shadowRoot?.removeEventListener("message", this.messageEventHandler as any);
            }
        } catch (error) {
            console.error("Error removing message listener:", error);
        }
    }

    private enhanceMessage(message: IMessage): IMessage {
        const enhanced = { ...message };
        enhanced.time = enhanced.time ?? new Date().toJSON();
        enhanced.visible = enhanced.visible ?? false;
        enhanced.timeout = enhanced.timeout ?? 0;
        enhanced.id = enhanced.id ?? Chat.generateUuid();
        enhanced.attachment = enhanced.attachment ?? {};
        return enhanced;
    }

    private getReplyTypeFromMessage(message: IMessage): ReplyType {
        const replyType = message.additionalParameters?.replyType;
        return Object.values(ReplyType).includes(replyType) ? replyType : this.state.replyType;
    }

    private writeToMessages = (message: IMessage): void => {
        const enhancedMessage = this.enhanceMessage(message);
        this.setState(prevState => ({
            messages: [...prevState.messages, enhancedMessage],
            replyType: this.getReplyTypeFromMessage(enhancedMessage)
        }));
        if (this.state.vrmReady) {
            this.createMessageBubble(enhancedMessage);
        }
    };

    static generateUuid(): string {
        return Array.from({ length: 36 }).map((_, index) => {
            if (index === 8 || index === 13 || index === 18 || index === 23) return '-';
            if (index === 14) return '4';
            const randomValue = index === 19 ? (Math.random() * 4 | 8) : (Math.random() * 16 | 0);
            return randomValue.toString(16);
        }).join('');
    }

    render(_props?: RenderableProps<IChatProps>, state: Readonly<IChatState> = this.state): JSX.Element {
        const { conf } = this.props;
        const isMobile = window.screen.width < 500;
        const { darkMode } = state;
        const chatHeight = isMobile ? conf.mobileHeight : conf.desktopHeight;
        const effectiveHeight = conf.wrapperHeight || chatHeight;

        // Brand colors (Dark Blue Theme)
        const lightColors = {
            darkPurple: '#f8f9fa',
            purple: '#0a92dd', // Brand Blue
            darkestPurple: '#ffffff',
            redPink: '#38bdf8', // Light Blue
            orange: '#f59e0b',
            lightText: '#0f172a', // Slate 900
            mutedPurple: '#94a3b8', // Slate 400
            softBackground: '#f1f5f9', // Slate 100
            cardBg: '#ffffff'
        };

        const darkColors = {
            darkPurple: '#1e293b', // Slate 800
            purple: '#0a92dd', // Brand Blue
            darkestPurple: '#0f172a', // Slate 900
            redPink: '#38bdf8', // Light Blue accent
            orange: '#f59e0b',
            lightText: '#f8fafc', // Slate 50
            mutedPurple: '#64748b', // Slate 500
            softBackground: '#020617', // Slate 950
            cardBg: '#1e293b' // Slate 800
        };

        const brandColors = darkMode ? darkColors : lightColors;

        const styles = {
            container: {
                position: 'relative' as const,
                height: effectiveHeight,
                width: '100%',
                display: 'flex',
                flexDirection: 'column' as const,
                overflow: 'hidden',
                background: `url('/garden_background.png') no-repeat center center / cover`,
                borderRadius: '0px',
                border: `1px solid ${brandColors.mutedPurple}`,
                boxShadow: darkMode
                    ? `0 20px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(14, 165, 233, 0.1)`
                    : `0 20px 60px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(148, 163, 184, 0.2)`,
                transition: 'height 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            },
            header: {
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '20px 24px',
                background: darkMode
                    ? `linear-gradient(135deg, ${brandColors.darkestPurple} 0%, ${brandColors.cardBg} 100%)`
                    : `linear-gradient(135deg, ${brandColors.darkestPurple} 0%, ${brandColors.cardBg} 100%)`,
                borderBottom: darkMode
                    ? `1px solid rgba(14, 165, 233, 0.2)`
                    : `1px solid rgba(148, 163, 184, 0.3)`,
                color: brandColors.lightText,
                backdropFilter: 'blur(10px)',
                minHeight: '60px',
                boxSizing: 'border-box' as const
            },
            headerTitle: {
                fontSize: '22px',
                fontWeight: '700',
                margin: 0,
                background: `linear-gradient(135deg, ${brandColors.purple} 0%, ${brandColors.redPink} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                letterSpacing: '-0.5px'
            },
            headerButtons: {
                display: 'flex',
                gap: '8px'
            },
            iconButton: {
                background: darkMode
                    ? 'rgba(14, 165, 233, 0.1)'
                    : 'rgba(148, 163, 184, 0.15)',
                border: darkMode
                    ? `1px solid rgba(14, 165, 233, 0.2)`
                    : `1px solid rgba(148, 163, 184, 0.3)`,
                cursor: 'pointer',
                padding: '10px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                color: brandColors.purple,
                backdropFilter: 'blur(10px)'
            },
            vrmSection: {
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '24px',
                margin: '20px auto',
                borderRadius: '20px',
                position: 'relative' as const,
                background: 'transparent',
                maxWidth: '90%',
                border: 'none',
                boxShadow: 'none',
                backdropFilter: 'none'
            },
            vrmContainer: {
                width: '100%',
                maxWidth: '400px',
                height: '400px',
                borderRadius: '16px',
                overflow: 'hidden',
                position: 'relative' as const,
                background: 'transparent',
                border: 'none',
                boxShadow: 'none'
            },
            enlargeButton: {
                position: 'absolute' as const,
                top: '16px',
                left: '16px',
                background: `linear-gradient(135deg, ${brandColors.purple} 0%, ${brandColors.redPink} 100%)`,
                color: darkMode ? brandColors.lightText : '#ffffff',
                border: 'none',
                borderRadius: '12px',
                padding: '10px 18px',
                fontSize: '14px',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: darkMode
                    ? '0 4px 16px rgba(14, 165, 233, 0.4)'
                    : '0 4px 16px rgba(10, 146, 221, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                zIndex: 12
            },
            statusBadge: {
                position: 'absolute' as const,
                top: '16px',
                right: '16px',
                background: `linear-gradient(135deg, ${brandColors.purple} 0%, ${brandColors.redPink} 100%)`,
                color: darkMode ? brandColors.lightText : '#ffffff',
                padding: '10px 16px',
                borderRadius: '12px',
                fontSize: '13px',
                fontWeight: '700',
                boxShadow: darkMode
                    ? '0 4px 16px rgba(179, 136, 216, 0.4)'
                    : '0 4px 16px rgba(108, 92, 231, 0.3)',
                zIndex: 12,
                backdropFilter: 'blur(10px)'
            },
            stopButton: {
                position: 'absolute' as const,
                bottom: '16px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: `linear-gradient(135deg, ${brandColors.redPink} 0%, ${brandColors.orange} 100%)`,
                color: darkMode ? brandColors.lightText : '#ffffff',
                padding: '12px 24px',
                borderRadius: '24px',
                fontSize: '14px',
                fontWeight: '700',
                boxShadow: darkMode
                    ? '0 4px 16px rgba(214, 122, 177, 0.4)'
                    : '0 4px 16px rgba(253, 121, 168, 0.3)',
                cursor: 'pointer',
                border: 'none',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                zIndex: 12
            },
            messageArea: {
                flex: 1,
                overflowY: 'auto' as const,
                overflowX: 'hidden' as const,
                padding: '24px',
                background: 'transparent',
                position: 'relative' as const,
                zIndex: 1,
                display: 'flex',
                flexDirection: 'column' as const
            },
            inputArea: {
                padding: '20px 24px',
                background: darkMode
                    ? `linear-gradient(135deg, ${brandColors.darkestPurple} 0%, ${brandColors.cardBg} 100%)`
                    : `linear-gradient(135deg, ${brandColors.darkestPurple} 0%, ${brandColors.cardBg} 100%)`,
                borderTop: darkMode
                    ? `1px solid rgba(179, 136, 216, 0.2)`
                    : `1px solid rgba(162, 155, 254, 0.3)`,
                backdropFilter: 'blur(10px)'
            },
            inputWrapper: {
                position: 'relative' as const,
                maxWidth: '100%',
                margin: '0 auto 12px'
            },
            input: {
                width: '100%',
                padding: '16px 60px 16px 20px',
                borderRadius: '16px',
                border: darkMode
                    ? `1px solid rgba(179, 136, 216, 0.3)`
                    : `1px solid rgba(162, 155, 254, 0.4)`,
                background: brandColors.softBackground,
                color: brandColors.lightText,
                fontSize: '15px',
                outline: 'none',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                fontFamily: 'system-ui, -apple-system, sans-serif',
                boxSizing: 'border-box' as const
            },
            sendButton: {
                position: 'absolute' as const,
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                border: 'none',
                background: `linear-gradient(135deg, ${brandColors.purple} 0%, ${brandColors.redPink} 100%)`,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: darkMode ? brandColors.lightText : '#ffffff',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: darkMode
                    ? '0 4px 16px rgba(179, 136, 216, 0.4)'
                    : '0 4px 16px rgba(108, 92, 231, 0.3)'
            },
            poweredBy: {
                textAlign: 'center' as const,
                fontSize: '13px',
                color: darkMode ? 'rgba(173, 181, 189, 0.7)' : 'rgba(99, 110, 114, 0.7)',
                letterSpacing: '0.3px'
            }
        };

        return (
            <div id="botmanChatRoot" style={styles.container}>
                <style>{`
                    @keyframes fadeIn {
                        from { opacity: 0; transform: scale(0.95); }
                        to { opacity: 1; transform: scale(1); }
                    }
                    button:hover {
                        transform: scale(1.05);
                    }
                    button:active {
                        transform: scale(0.98);
                    }
                    input:focus {
                        border-color: ${brandColors.purple};
                        box-shadow: 0 0 0 4px ${darkMode ? 'rgba(179, 136, 216, 0.15)' : 'rgba(108, 92, 231, 0.15)'};
                    }
                `}</style>

                {/* Header */}
                <div style={styles.header}>
                    <div>
                        <h2 style={styles.headerTitle}>{conf.title || 'Virtual Assistant'}</h2>
                        <a
                            href="https://laravelgpt.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                fontSize: '12px',
                                color: brandColors.mutedPurple,
                                textDecoration: 'none',
                                display: 'block',
                                marginTop: '2px',
                                opacity: 0.8
                            }}
                        >
                            <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Powered by</span> <span style={{ color: brandColors.purple, fontWeight: '600' }}>Laravel GPT</span>
                        </a>
                    </div>
                    <div style={styles.headerButtons}>
                        <button
                            onClick={this.toggleDarkMode}
                            style={styles.iconButton}
                            aria-label="Toggle theme"
                            title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                        >
                            {darkMode ? (
                                <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                            ) : (
                                <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                </svg>
                            )}
                        </button>
                        <button
                            onClick={this.toggleMinimize}
                            style={styles.iconButton}
                            aria-label="Minimize chat"
                            title="Minimize Chat"
                        >
                            <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* VRM Avatar Section */}
                {!state.isVrmEnlarged && state.vrmLoaded && (
                    <div style={styles.vrmSection}>
                        <div
                            id="vrm-container"
                            ref={this.vrmContainerRef}
                            style={styles.vrmContainer}
                        />
                        <button
                            onClick={this.toggleVrmEnlarge}
                            style={styles.enlargeButton}
                        >
                            <span style={{ fontSize: '18px' }}>⛶</span> Enlarge
                        </button>
                        <div style={styles.statusBadge}>
                            {state.isSpeaking ? '🗣️ Speaking' : state.vrmReady ? '✅ Active' : '⏳ Loading'}
                        </div>
                        {state.isSpeaking && (
                            <button
                                onClick={() => this.stopSpeaking()}
                                style={styles.stopButton}
                            >
                                🛑 Stop Speaking
                            </button>
                        )}
                    </div>
                )}

                {/* Message Area */}
                <div style={styles.messageArea} id="messageArea">
                    <MessageArea
                        messages={state.messages}
                        conf={this.props.conf}
                        messageHandler={this.messageEventHandler}
                    />
                </div>

                {/* Input Area */}
                <div style={styles.inputArea}>
                    <div style={styles.inputWrapper}>
                        <input
                            id="chat-input"
                            ref={(input) => { this.inputRef = input as HTMLInputElement; }}
                            type="text"
                            autoComplete="off"
                            placeholder={conf.placeholderText || "Send a message..."}
                            style={styles.input}
                            onKeyPress={this.handleKeyPress}
                            autoFocus
                        />
                        <button
                            onClick={this.handleSendClick}
                            style={styles.sendButton}
                            aria-label="Send message"
                        >
                            <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.768 59.768 0 013.27 20.876L5.999 12zm0 0h7.5" />
                            </svg>
                        </button>
                    </div>

                </div>

                {/* Enlarged VRM Modal */}
                {state.isVrmEnlarged && (
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        width: '100%',
                        height: '100%',
                        zIndex: 999999,
                        background: darkMode ? 'rgba(0, 0, 0, 0.96)' : 'rgba(0, 0, 0, 0.85)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        animation: 'fadeIn 0.3s ease-in-out',
                        padding: '20px',
                        boxSizing: 'border-box' as const
                    }} onClick={this.toggleVrmEnlarge}>
                        <div style={{
                            width: '95%',
                            height: '95%',
                            borderRadius: '24px',
                            overflow: 'hidden',
                            position: 'relative',
                            background: `url('/garden_background.png') no-repeat center center / cover`,
                            boxShadow: darkMode
                                ? `0 30px 90px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(179, 136, 216, 0.3)`
                                : `0 30px 90px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(162, 155, 254, 0.4)`,
                            border: `2px solid ${brandColors.mutedPurple}`
                        }} onClick={(e) => e.stopPropagation()}>
                            <div
                                id="vrm-container-enlarged"
                                ref={this.vrmEnlargedContainerRef}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    position: 'relative',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            />
                            <button
                                onClick={this.toggleVrmEnlarge}
                                style={{
                                    position: 'absolute',
                                    top: '20px',
                                    right: '20px',
                                    background: `linear-gradient(135deg, ${brandColors.redPink} 0%, ${brandColors.orange} 100%)`,
                                    border: 'none',
                                    borderRadius: '50%',
                                    width: '56px',
                                    height: '56px',
                                    fontSize: '24px',
                                    cursor: 'pointer',
                                    boxShadow: darkMode
                                        ? '0 6px 24px rgba(214, 122, 177, 0.5)'
                                        : '0 6px 24px rgba(253, 121, 168, 0.4)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    zIndex: 1000001,
                                    color: darkMode ? brandColors.lightText : '#ffffff',
                                    fontWeight: '300'
                                }}
                                aria-label="Close enlarged view"
                            >
                                ✕
                            </button>
                            <div style={{
                                position: 'absolute',
                                bottom: '24px',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                background: `linear-gradient(135deg, ${brandColors.purple} 0%, ${brandColors.redPink} 100%)`,
                                color: darkMode ? brandColors.lightText : '#ffffff',
                                padding: '14px 32px',
                                borderRadius: '16px',
                                fontSize: '16px',
                                fontWeight: '700',
                                boxShadow: darkMode
                                    ? '0 6px 24px rgba(194, 112, 200, 0.6)'
                                    : '0 6px 24px rgba(108, 92, 231, 0.5)',
                                zIndex: 1000001,
                                backdropFilter: 'blur(10px)'
                            }}>
                                {state.isSpeaking ? '🗣️ Speaking...' : state.vrmReady ? '✅ Avatar Active' : '⏳ Loading Avatar...'}
                            </div>
                            {state.isSpeaking && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        this.stopSpeaking();
                                    }}
                                    style={{
                                        position: 'absolute',
                                        bottom: '88px',
                                        left: '50%',
                                        transform: 'translateX(-50%)',
                                        background: `linear-gradient(135deg, ${brandColors.redPink} 0%, ${brandColors.orange} 100%)`,
                                        color: darkMode ? brandColors.lightText : '#ffffff',
                                        padding: '14px 28px',
                                        borderRadius: '28px',
                                        fontSize: '15px',
                                        fontWeight: '700',
                                        boxShadow: darkMode
                                            ? '0 6px 24px rgba(214, 122, 177, 0.6)'
                                            : '0 6px 24px rgba(253, 121, 168, 0.5)',
                                        cursor: 'pointer',
                                        border: 'none',
                                        zIndex: 1000001
                                    }}
                                >
                                    🛑 Stop Speaking
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        );
    }
}
