
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
    mainColor?: string;
    bubbleBackground?: string;
    bubbleAvatarUrl?: string;
    aboutLink?: string;
    aboutText?: string;
}

export interface IMessage {
    id?: string;
    text?: string;
    type?: string;
    from: string;
    attachment?: IAttachment | null;
    time?: string;
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
