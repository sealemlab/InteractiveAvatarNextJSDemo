import type { StartAvatarResponse } from "@heygen/streaming-avatar";

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
import { useEffect, useRef, useState } from "react";
import { useMemoizedFn, usePrevious } from "ahooks";

import InteractiveAvatarTextInput from "./InteractiveAvatarTextInput";

import { useI18n } from "@/app/lib/i18n";
import { AVATARS, STT_LANGUAGE_LIST } from "@/app/lib/constants";

export default function InteractiveAvatar() {
  const { t } = useI18n();
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const [isLoadingRepeat, setIsLoadingRepeat] = useState(false);
  const [stream, setStream] = useState<MediaStream>();
  // const [debug, setDebug] = useState<string>();
  // const [knowledgeId, setKnowledgeId] = useState<string>('');

  const [knowledgeBase, setKnowledgeBase] = useState<string>(
    t("nav.default.prompt"),
  );
  const previousDefaultPrompt = useRef(t("nav.default.prompt"));
  const [avatarId, setAvatarId] = useState<string>(
    "6b321163a4ec4ad3a5bdd85f67bf09a1",
  );
  const [language, setLanguage] = useState<string>("zh");

  // 监听语言变化，更新默认提示词
  useEffect(() => {
    const newDefaultPrompt = t("nav.default.prompt");

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
        knowledgeBase: knowledgeBase, // Or use a custom `knowledgeBase`.
        voice: {
          rate: 1.5, // 0.5 ~ 1.5
          emotion: VoiceEmotion.EXCITED,
        },
        language: language,
        disableIdleTimeout: true,
      });

      setData(res);
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

  return (
    <div className="w-[90vw] sm:w-[800px] mx-auto flex flex-col gap-4">
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
                  {t("nav.interrupt")}
                </Button>
                <Button
                  className="bg-green-400 hover:bg-green-500 text-white rounded-lg text-xs sm:text-sm"
                  size="sm"
                  variant="shadow"
                  onClick={endSession}
                >
                  {t("nav.end")}
                </Button>
              </div>
            </div>
          ) : !isLoadingSession ? (
            <div className="h-full justify-center items-center flex flex-col gap-4 sm:gap-8 w-full self-center">
              <div className="flex flex-col gap-4 w-full">
                <p className="text-sm font-medium leading-none">
                  {t("nav.upload")}
                </p>
                <div
                  className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-3 sm:p-4 text-center cursor-pointer hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
                  role="button"
                  tabIndex={0}
                  onClick={() =>
                    document.getElementById("file-upload")?.click()
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === "Space") {
                      e.preventDefault();
                      document.getElementById("file-upload")?.click();
                    }
                  }}
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    <svg
                      className="w-6 h-6 sm:w-8 sm:h-8 text-gray-500 dark:text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                      />
                    </svg>
                    <div className="flex flex-col items-center">
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                        {t("nav.upload.tip")}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {t("nav.upload.format")}
                      </p>
                    </div>
                  </div>
                  <input
                    accept=".pdf,.ppt,.pptx"
                    className="hidden"
                    id="file-upload"
                    type="file"
                    onChange={(e) => {
                      const file = e.target.files?.[0];

                      if (file) {
                        const fileType = file.name
                          .toLowerCase()
                          .split(".")
                          .pop();

                        if (!["pdf", "ppt", "pptx"].includes(fileType || "")) {
                          alert("Please upload a PDF or PPT file");
                          e.target.value = "";

                          return;
                        }
                        console.log("Selected file:", file);
                      }
                    }}
                  />
                </div>

                <p className="text-sm font-medium leading-none">
                  {t("nav.full.prompt")}
                </p>
                <Textarea
                  maxRows={10}
                  minRows={5}
                  placeholder={t("nav.prompt.placeholder")}
                  value={knowledgeBase}
                  onChange={(e) => setKnowledgeBase(e.target.value)}
                />

                <p className="text-sm font-medium leading-none">
                  {t("nav.select.avatar")}
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
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === "Space") {
                          e.preventDefault();
                          setAvatarId(ava.avatar_id);
                        }
                      }}
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
                  {t("nav.select.language")}
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
                {t("nav.start")}
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
            <Tab key="text_mode" title={t("nav.text.mode")} />
            <Tab key="voice_mode" title={t("nav.voice.mode")} />
          </Tabs>
          {chatMode === "text_mode" ? (
            <div className="w-full flex relative">
              <InteractiveAvatarTextInput
                disabled={!stream}
                input={text}
                label=""
                loading={isLoadingRepeat}
                placeholder={t("nav.input.placeholder")}
                setInput={setText}
                onSubmit={handleSpeak}
              />
              {text && (
                <Chip className="absolute right-16 top-3 bg-green-400 text-white">
                  {t("nav.listening")}
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
                {isUserTalking ? t("nav.voice.listening") : t("nav.voice.chat")}
              </Button>
            </div>
          )}
        </CardFooter>

        <hr className="border-dashed" />

        <div className="w-full p-3 sm:p-5">
          <div className="w-full flex items-center justify-between">
            <span className="text-sm sm:text-base">
              {t("nav.output.report")}
            </span>
            <Button
              isIconOnly
              className="bg-green-400 hover:bg-green-500 text-white"
              size="sm"
              variant="shadow"
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
            <p className="text-sm" />
          </div>
        </div>
      </Card>
      {/* <p className="font-mono text-right">
        <span className="font-bold">Console:</span>
        <br />
        {debug}
      </p> */}
    </div>
  );
}
