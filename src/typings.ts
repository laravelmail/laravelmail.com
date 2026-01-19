export interface IMessage {
    id?: string;
    text?: string;
    type?: string;
    from: string;
    attachment?: IAttachment | null;
    time?: string;
    visible?: boolean;
    timeout?: number;
    additionalParameters?: any;
    actions?: IAction[];
    buttons?: IButton[];
    globalButtons?: IButton[];
    elements?: IElement[];
    visibilityChanged?: boolean;
}

export interface IConfiguration {
    chatServer: string;
    requestHeaders?: any;
    userId: string;
    introMessage?: string;
    placeholderText?: string;
    useShadowDom?: boolean;
    useChatAsIframe?: boolean;
    useInAppCss?: boolean;
    customStylesInjection?: string;
    vrmModelUrl?: string;
    mobileHeight?: string;
    desktopHeight?: string;
    wrapperHeight?: string;
    headerTitle?: string;
    title?: string;
    mainColor?: string;
    bubbleBackground?: string;
    bubbleAvatarUrl?: string;
    aboutLink?: string;
    aboutText?: string;
    useLoader?: boolean;
    videoHeight?: number;
}

export interface IAttachment {
    type?: string;
    url?: string;
    title?: string;
    file?: IFileAttachment;
}

export interface IFileAttachment {
    name: string;
    type: string;
    size: number;
    data: string | ArrayBuffer | null;
    preview?: string;
}

export interface IMessageTypeState {
    visible: boolean;
    visibilityChanged: boolean;
    attachmentsVisible: boolean;
}

export interface IMessageTypeProps {
    message: IMessage;
    onVisibilityChange: (message: IMessage, state: IMessageTypeState) => void;
    timeout?: number;
    conf?: IConfiguration; // Sometimes passed down
}

export interface IAction {
    text: string;
    value: string;
    additional?: any;
}

export interface IButton {
    type: string;
    title: string;
    url?: string;
    payload?: string;
}

export interface IElement {
    title: string;
    subtitle?: string;
    image_url?: string;
    buttons: IButton[];
}

export interface IMessageHolderProps {
    message: IMessage;
    calculatedTimeout: number;
    messageHandler: Function;
    conf: IConfiguration;
}
