import type { StartAvatarResponse } from "@heygen/streaming-avatar";
import type { UploadProps } from "antd";

import { Upload, message } from "antd";
import {
  InboxOutlined,
  LoadingOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import StreamingAvatar, {
  AvatarQuality,
  StreamingEvents,
  TaskMode,
  TaskType,
  VoiceEmotion,
} from "@heygen/streaming-avatar";
import {
  Button,
  Card,
  CardBody,
  CardFooter,
  Divider,
  Spinner,
  Chip,
  Tabs,
  Tab,
  Textarea,
  RadioGroup,
  Radio,
  Image,
} from "@nextui-org/react";
import { useEffect, useRef, useState, Suspense } from "react";
import { useMemoizedFn, usePrevious } from "ahooks";
import { useRouter, useSearchParams } from "next/navigation";

import InteractiveAvatarTextInput from "./InteractiveAvatarTextInput";

import { useI18n } from "@/app/lib/i18n";
import { AVATARS, STT_LANGUAGE_LIST } from "@/app/lib/constants";

export default function InteractiveAvatar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useI18n();
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const [isLoadingRepeat, setIsLoadingRepeat] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [stream, setStream] = useState<MediaStream>();
  // const [debug, setDebug] = useState<string>();
  // const [knowledgeId, setKnowledgeId] = useState<string>('');

  const [knowledgeBase, setKnowledgeBase] = useState<string>(
    t("default.prompt"),
  );
  const previousDefaultPrompt = useRef(t("default.prompt"));
  const [avatarId, setAvatarId] = useState<string>(
    "6b321163a4ec4ad3a5bdd85f67bf09a1",
  );
  const [language, setLanguage] = useState<string>("zh");

  // 监听语言变化，更新默认提示词
  useEffect(() => {
    const newDefaultPrompt = t("default.prompt");

    // 只有当knowledgeBase是之前的默认提示词时才更新
    if (knowledgeBase === previousDefaultPrompt.current) {
      setKnowledgeBase(newDefaultPrompt);
    }
    previousDefaultPrompt.current = newDefaultPrompt;
  }, [t, knowledgeBase]);

  const [data, setData] = useState<StartAvatarResponse>();
  const [text, setText] = useState<string>("");
  const mediaStream = useRef<HTMLVideoElement>(null);
  const avatar = useRef<StreamingAvatar | null>(null);
  const [chatMode, setChatMode] = useState("text_mode");
  const [isUserTalking, setIsUserTalking] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [sessionSummary, setSessionSummary] = useState<string>("");
  const [porjectSummary, setPorjectSummary] = useState<string>("");
  const [generateUrl, setGenerateUrl] = useState<string>("");
  const [isGeneratingPPT, setIsGeneratingPPT] = useState(false);

  const { Dragger } = Upload;

  const uploadProps: UploadProps = {
    name: "files",
    multiple: false,
    showUploadList: false,
    accept: ".pdf,.ppt,.pptx",
    customRequest: async (options) => {
      const { file, onSuccess, onError } = options;

      try {
        setIsUploading(true);
        setUploadSuccess(false);
        message.loading({
          content: t("upload.loading"),
          key: "uploading",
          duration: 0,
        });

        const formData = new FormData();

        formData.append("files", file as File);

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Upload failed with status: ${response.status}`);
        }

        const data = await response.json();
        const resultObj = JSON.parse(data.result);
        const summary = resultObj.message.result[0].result.output.summary;

        setPorjectSummary(summary);

        // 更新knowledgeBase，替换项目背景部分
        const updatedPrompt = knowledgeBase.replace(
          /\[此处填入当前项目的详细资料\]|\[Insert detailed information about current project here\]/,
          summary,
        );

        setKnowledgeBase(updatedPrompt);
        setUploadSuccess(true);
        message.success({ content: t("upload.success"), key: "uploading" });
        onSuccess?.(data);
      } catch (error) {
        console.error("Upload error:", error);
        setUploadSuccess(false);
        message.error({ content: t("upload.error"), key: "uploading" });
        onError?.(error as Error);
      } finally {
        setIsUploading(false);
      }
    },
    beforeUpload: (file) => {
      const isValidType = [
        "application/pdf",
        "application/vnd.ms-powerpoint",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "image/png",
        "image/jpeg",
      ].includes(file.type);

      if (!isValidType) {
        message.error(t("upload.tip2"));

        return false;
      }

      const isLt10M = file.size / 1024 / 1024 < 10;

      if (!isLt10M) {
        message.error(t("upload.size.limit"));

        return false;
      }

      return true;
    },
  };

  async function fetchAccessToken() {
    try {
      const response = await fetch("/api/get-access-token", {
        method: "POST",
      });

      const token = await response.text();

      console.log("Access Token:", token); // Log the token to verify

      return token;
    } catch (error) {
      console.error("Error fetching access token:", error);
    }

    return "";
  }

  const fetchSessionDetail = async (sessionId: string) => {
    try {
      const response = await fetch(
        `/api/session-detail?session_id=${sessionId}`,
        {
          method: "GET",
        },
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch session detail: ${response.status}`);
      }
      const data = await response.json();

      if (data.summary) {
        setSessionSummary(data.summary);
      }
    } catch (error) {
      console.error("Error fetching session detail:", error);
    }
  };

  async function startSession() {
    setIsLoadingSession(true);
    const newToken = await fetchAccessToken();

    avatar.current = new StreamingAvatar({
      token: newToken,
    });
    avatar.current.on(StreamingEvents.AVATAR_START_TALKING, (e) => {
      console.log("Avatar started talking", e);
    });
    avatar.current.on(StreamingEvents.AVATAR_STOP_TALKING, (e) => {
      console.log("Avatar stopped talking", e);
    });
    avatar.current.on(StreamingEvents.STREAM_DISCONNECTED, () => {
      console.log("Stream disconnected");
      endSession();
    });
    avatar.current?.on(StreamingEvents.STREAM_READY, (event) => {
      console.log(">>>>> Stream ready:", event.detail);
      setStream(event.detail);
    });
    avatar.current?.on(StreamingEvents.USER_START, (event) => {
      console.log(">>>>> User started talking:", event);
      setIsUserTalking(true);
    });
    avatar.current?.on(StreamingEvents.USER_STOP, (event) => {
      console.log(">>>>> User stopped talking:", event);
      setIsUserTalking(false);
    });
    try {
      const res = await avatar.current.createStartAvatar({
        quality: AvatarQuality.Low,
        avatarName: avatarId,
        knowledgeBase: knowledgeBase,
        voice: {
          rate: 1.5,
          emotion: VoiceEmotion.EXCITED,
        },
        language: language,
        disableIdleTimeout: true,
      });

      setData(res);
      console.log("createStartAvatar", res);

      // 获取会话详情
      if (res.session_id) {
        fetchSessionDetail(res.session_id);
      }

      // default to voice mode
      await avatar.current?.startVoiceChat({
        useSilencePrompt: false,
      });
      setChatMode("voice_mode");
    } catch (error) {
      console.error("Error starting avatar session:", error);
    } finally {
      setIsLoadingSession(false);
    }
  }
  async function handleSpeak() {
    setIsLoadingRepeat(true);
    if (!avatar.current) {
      // setDebug("Avatar API not initialized");

      return;
    }
    // speak({ text: text, task_type: TaskType.REPEAT })
    await avatar.current
      .speak({ text: text, taskType: TaskType.REPEAT, taskMode: TaskMode.SYNC })
      .catch((e) => {
        // setDebug(e.message);
      });
    setIsLoadingRepeat(false);
  }
  async function handleInterrupt() {
    if (!avatar.current) {
      // setDebug("Avatar API not initialized");

      return;
    }
    await avatar.current.interrupt().catch((e) => {
      // setDebug(e.message);
    });
  }
  async function endSession() {
    await avatar.current?.stopAvatar();
    setStream(undefined);
  }

  const handleChangeChatMode = useMemoizedFn(async (v) => {
    if (v === chatMode) {
      return;
    }
    if (v === "text_mode") {
      avatar.current?.closeVoiceChat();
    } else {
      await avatar.current?.startVoiceChat();
    }
    setChatMode(v);
  });

  const previousText = usePrevious(text);

  useEffect(() => {
    if (!previousText && text) {
      avatar.current?.startListening();
    } else if (previousText && !text) {
      avatar?.current?.stopListening();
    }
  }, [text, previousText]);

  useEffect(() => {
    return () => {
      endSession();
    };
  }, []);

  useEffect(() => {
    if (stream && mediaStream.current) {
      mediaStream.current.srcObject = stream;
      mediaStream.current.onloadedmetadata = () => {
        mediaStream.current!.play();
        // setDebug("Playing");
      };
    }
  }, [mediaStream, stream]);

  // 添加检查任务状态的函数
  const checkTaskStatus = async (taskId: string) => {
    try {
      const response = await fetch(`/api/check-task-status?task_id=${taskId}`);

      if (!response.ok) {
        throw new Error(`Failed to check task status: ${response.status}`);
      }
      const data = await response.json();

      if (data.task_status === "SUCCESS" && data.task_result?.url) {
        setGenerateUrl(data.task_result.url);
        setIsGeneratingPPT(false);
        message.success({ content: t("generate.success"), key: "generate" });
      } else if (
        data.task_status === "PENDING" ||
        data.task_status === "SENT"
      ) {
        // 如果任务还在进行中，2秒后继续轮询
        setTimeout(() => checkTaskStatus(taskId), 1000 * 15);
      } else {
        // 其他状态都视为失败
        setIsGeneratingPPT(false);
        message.error({ content: t("generate.error"), key: "generate" });
      }
    } catch (error) {
      console.error("Error checking task status:", error);
      setIsGeneratingPPT(false);
      message.error({ content: t("generate.error"), key: "generate" });
    }
  };

  useEffect(() => {
    if (porjectSummary) {
      setIsGeneratingPPT(true);
      fetch("/api/generate-slides", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectSummary: porjectSummary,
        }),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.task_id) {
            checkTaskStatus(data.task_id);
          }
        })
        .catch((error) => {
          console.error("Error generating slides:", error);
          setIsGeneratingPPT(false);
        });
    }
  }, [porjectSummary]);

  // 处理下载
  const handleDownload = () => {
    if (generateUrl) {
      window.open(generateUrl, "_blank");
    }
  };

  // 处理分享
  const handleShare = () => {
    const encodedPrompt = btoa(encodeURIComponent(knowledgeBase));
    const currentUrl = window.location.origin + window.location.pathname;
    const shareUrl = `${currentUrl}?prompt=${encodedPrompt}`;

    // 复制到剪贴板
    navigator.clipboard.writeText(shareUrl).then(() => {
      message.success({ content: t("share.success"), key: "share" });
    });
  };

  // 从 URL 参数中读取 prompt
  useEffect(() => {
    const promptParam = searchParams.get("prompt");

    if (promptParam) {
      try {
        const decodedPrompt = decodeURIComponent(atob(promptParam));

        setKnowledgeBase(decodedPrompt);
      } catch (error) {
        console.error("Error decoding prompt:", error);
      }
    }
  }, [searchParams]);

  // 修改事件处理函数，添加下划线前缀表示未使用的参数
  const handleKeyDown = (_e: React.KeyboardEvent) => {
    // ... existing code ...
  };

  return (
    <div className="w-[90vw] sm:w-[800px] mx-auto flex flex-col gap-4">
      <Suspense fallback={<div>Loading...</div>}>
        <Card>
          <CardBody className="flex flex-col items-center p-3 sm:p-5 min-h-[300px]">
            <p className="text-2xl sm:text-4xl font-bold leading-loose text-gray-800 dark:text-gray-200">
              AIGREE AVATAR DEMO
            </p>

            {stream ? (
              <div className="w-full h-[300px] justify-center items-center flex rounded-lg overflow-hidden">
                <video
                  ref={mediaStream}
                  autoPlay
                  playsInline
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                  }}
                >
                  <track kind="captions" />
                </video>
                <div className="flex flex-col gap-2 absolute bottom-3 right-3">
                  <Button
                    className="bg-green-400 hover:bg-green-500 text-white rounded-lg text-xs sm:text-sm"
                    size="sm"
                    variant="shadow"
                    onClick={handleInterrupt}
                  >
                    {t("interrupt")}
                  </Button>
                  <Button
                    className="bg-green-400 hover:bg-green-500 text-white rounded-lg text-xs sm:text-sm"
                    size="sm"
                    variant="shadow"
                    onClick={endSession}
                  >
                    {t("end.session")}
                  </Button>
                </div>
              </div>
            ) : !isLoadingSession ? (
              <div className="h-full justify-center items-center flex flex-col gap-4 sm:gap-8 w-full self-center">
                <div className="flex flex-col gap-4 w-full">
                  <p className="text-sm font-medium leading-none">
                    {t("upload.title")}
                  </p>
                  <Dragger
                    {...uploadProps}
                    className="bg-white dark:bg-gray-800"
                  >
                    <p className="ant-upload-drag-icon text-green-400">
                      {isUploading ? (
                        <LoadingOutlined />
                      ) : uploadSuccess ? (
                        <CheckCircleOutlined />
                      ) : (
                        <InboxOutlined />
                      )}
                    </p>
                    <p className="ant-upload-text text-gray-600 dark:text-gray-300">
                      {isUploading
                        ? t("upload.loading")
                        : uploadSuccess
                          ? t("upload.success")
                          : t("upload.tip")}
                    </p>
                    <p className="ant-upload-hint text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {t("upload.tip2")}
                    </p>
                  </Dragger>

                  <div className="flex justify-between items-center">
                    <p className="text-sm font-medium leading-none">
                      {t("prompt.title")}
                    </p>
                    <Button
                      className="bg-green-400 hover:bg-green-500 text-white"
                      size="sm"
                      variant="shadow"
                      onClick={handleShare}
                    >
                      {t("share")}
                    </Button>
                  </div>
                  <Textarea
                    maxRows={10}
                    minRows={5}
                    placeholder={t("prompt.placeholder")}
                    value={knowledgeBase}
                    onChange={(e) => setKnowledgeBase(e.target.value)}
                  />

                  <p className="text-sm font-medium leading-none">
                    {t("avatar.select")}
                  </p>
                  <RadioGroup
                    classNames={{
                      wrapper: "gap-10 justify-center items-center flex-wrap",
                    }}
                    color="success"
                    orientation="horizontal"
                    value={avatarId}
                    onValueChange={setAvatarId}
                  >
                    {AVATARS.map((ava) => (
                      <div
                        key={ava.avatar_id}
                        className="flex flex-col justify-center items-center cursor-pointer"
                        role="button"
                        tabIndex={0}
                        onClick={() => setAvatarId(ava.avatar_id)}
                        onKeyDown={handleKeyDown}
                      >
                        <Image
                          isBlurred
                          alt={ava.name}
                          className="object-cover rounded-lg transition-transform hover:scale-105"
                          height={100}
                          src={ava.avatar}
                          width={100}
                        />
                        <Radio
                          className="text-xs sm:text-sm mt-2"
                          value={ava.avatar_id}
                        >
                          {ava.name}
                        </Radio>
                      </div>
                    ))}
                  </RadioGroup>

                  <p className="text-sm font-medium leading-none">
                    {t("language.select")}
                  </p>
                  <RadioGroup
                    className="items-center"
                    color="success"
                    orientation="horizontal"
                    value={language}
                    onValueChange={setLanguage}
                  >
                    {STT_LANGUAGE_LIST.map((lang) => (
                      <Radio
                        key={lang.key}
                        className="text-xs sm:text-sm"
                        value={lang.key}
                      >
                        {lang.label}
                      </Radio>
                    ))}
                  </RadioGroup>
                </div>
                <Button
                  className="bg-green-400 hover:bg-green-500 w-full text-white text-sm sm:text-base"
                  size="md"
                  variant="shadow"
                  onClick={startSession}
                >
                  {t("start.session")}
                </Button>
              </div>
            ) : (
              <Spinner className="mt-10" color="success" size="lg" />
            )}
          </CardBody>

          <Divider />

          <CardFooter className="flex flex-col items-start gap-4 relative p-3 sm:p-5">
            <Tabs
              aria-label="Options"
              classNames={{
                tabList: "gap-6",
                cursor: "bg-green-400",
                tab: "max-w-fit px-0 h-12",
              }}
              selectedKey={chatMode}
              variant="underlined"
              onSelectionChange={(v) => {
                handleChangeChatMode(v);
              }}
            >
              <Tab key="text_mode" title={t("text.mode")} />
              <Tab key="voice_mode" title={t("voice.mode")} />
            </Tabs>
            {chatMode === "text_mode" ? (
              <div className="w-full flex relative">
                <InteractiveAvatarTextInput
                  disabled={!stream}
                  input={text}
                  label=""
                  loading={isLoadingRepeat}
                  placeholder={t("input.placeholder")}
                  setInput={setText}
                  onSubmit={handleSpeak}
                />
                {text && (
                  <Chip className="absolute right-16 top-3 bg-green-400 text-white">
                    {t("listening")}
                  </Chip>
                )}
              </div>
            ) : (
              <div className="w-full text-center">
                <Button
                  className="bg-green-400 hover:bg-green-500 text-white"
                  isDisabled={!isUserTalking}
                  size="md"
                  variant="shadow"
                >
                  {isUserTalking ? t("voice.listening") : t("voice.chat")}
                </Button>
              </div>
            )}
          </CardFooter>

          <hr className="border-dashed" />

          <div className="w-full p-3 sm:p-5">
            <div className="w-full flex items-center justify-between">
              <span className="text-sm sm:text-base">
                {t("meeting.minutes")}
              </span>
            </div>
            <div className="w-full border border-dashed rounded-lg mt-2 p-2">
              <p className="text-sm whitespace-pre-wrap">{sessionSummary}</p>
            </div>
          </div>

          <div className="w-full p-3 sm:p-5">
            <div className="w-full flex items-center justify-between">
              <span className="text-sm sm:text-base">{t("output.report")}</span>
              <Button
                isIconOnly
                aria-label={t("download")}
                className="bg-green-400 hover:bg-green-500 text-white"
                isDisabled={!generateUrl}
                isLoading={isGeneratingPPT}
                size="sm"
                variant="shadow"
                onClick={handleDownload}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                  />
                </svg>
              </Button>
            </div>

            <div className="w-full border border-dashed rounded-lg mt-2 p-2">
              {isGeneratingPPT ? (
                <div className="flex items-center justify-center p-4">
                  <Spinner color="success" size="sm" />
                  <span className="ml-2 text-sm">{t("generate.loading")}</span>
                </div>
              ) : generateUrl ? (
                <div className="w-full border border-dashed rounded-lg mt-2 p-2">
                  <p className="text-sm whitespace-pre-wrap">{generateUrl}</p>
                </div>
              ) : (
                <></>
              )}
            </div>
          </div>
        </Card>
      </Suspense>

      {/* <p className="font-mono text-right">
        <span className="font-bold">Console:</span>
        <br />
        {debug}
      </p> */}
    </div>
  );
}
