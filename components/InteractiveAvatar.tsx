import type { StartAvatarResponse } from '@heygen/streaming-avatar';
import { Belanosima } from 'next/font/google';

const belanosima = Belanosima({ subsets: ['latin'], weight: ['400', '600', '700'] });

import StreamingAvatar, {
  AvatarQuality,
  StreamingEvents,
  TaskMode,
  TaskType,
  VoiceEmotion
} from '@heygen/streaming-avatar';
import {
  Button,
  Card,
  CardBody,
  CardFooter,
  Divider,
  Input,
  Select,
  SelectItem,
  Spinner,
  Chip,
  Tabs,
  Tab,
  Textarea,
  RadioGroup,
  Radio,
  Image
} from '@nextui-org/react';
import { useEffect, useRef, useState } from 'react';
import { useMemoizedFn, usePrevious } from 'ahooks';

import InteractiveAvatarTextInput from './InteractiveAvatarTextInput';

import { AVATARS, STT_LANGUAGE_LIST } from '@/app/lib/constants';

export default function InteractiveAvatar() {
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const [isLoadingRepeat, setIsLoadingRepeat] = useState(false);
  const [stream, setStream] = useState<MediaStream>();
  // const [debug, setDebug] = useState<string>();
  // const [knowledgeId, setKnowledgeId] = useState<string>('7b5606ccf7154a9ab720c245a247ce78');
  const [knowledgeBase, setKnowledgeBase] = useState<string>('');
  const [avatarId, setAvatarId] = useState<string>('6b321163a4ec4ad3a5bdd85f67bf09a1');
  const [language, setLanguage] = useState<string>('zh');

  const [data, setData] = useState<StartAvatarResponse>();
  const [text, setText] = useState<string>('');
  const mediaStream = useRef<HTMLVideoElement>(null);
  const avatar = useRef<StreamingAvatar | null>(null);
  const [chatMode, setChatMode] = useState('text_mode');
  const [isUserTalking, setIsUserTalking] = useState(false);

  async function fetchAccessToken() {
    try {
      const response = await fetch('/api/get-access-token', {
        method: 'POST'
      });
      console.log('response', response);
      const token = await response.text();

      console.log('Access Token:', token); // Log the token to verify

      return token;
    } catch (error) {
      console.error('Error fetching access token:', error);
    }

    return '';
  }

  async function startSession() {
    setIsLoadingSession(true);
    const newToken = await fetchAccessToken();
    console.log('newToken', newToken);

    avatar.current = new StreamingAvatar({
      token: newToken
    });
    avatar.current.on(StreamingEvents.AVATAR_START_TALKING, (e) => {
      console.log('Avatar started talking', e);
    });
    avatar.current.on(StreamingEvents.AVATAR_STOP_TALKING, (e) => {
      console.log('Avatar stopped talking', e);
    });
    avatar.current.on(StreamingEvents.STREAM_DISCONNECTED, () => {
      console.log('Stream disconnected');
      endSession();
    });
    avatar.current?.on(StreamingEvents.STREAM_READY, (event) => {
      console.log('>>>>> Stream ready:', event.detail);
      setStream(event.detail);
    });
    avatar.current?.on(StreamingEvents.USER_START, (event) => {
      console.log('>>>>> User started talking:', event);
      setIsUserTalking(true);
    });
    avatar.current?.on(StreamingEvents.USER_STOP, (event) => {
      console.log('>>>>> User stopped talking:', event);
      setIsUserTalking(false);
    });
    try {
      const res = await avatar.current.createStartAvatar({
        quality: AvatarQuality.Low,
        avatarName: avatarId,
        knowledgeBase: knowledgeBase, // Or use a custom `knowledgeBase`.
        voice: {
          rate: 1.5, // 0.5 ~ 1.5
          emotion: VoiceEmotion.EXCITED
        },
        language: language,
        disableIdleTimeout: true
      });

      setData(res);
      // default to voice mode
      await avatar.current?.startVoiceChat({
        useSilencePrompt: false
      });
      setChatMode('voice_mode');
    } catch (error) {
      console.error('Error starting avatar session:', error);
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
    await avatar.current.speak({ text: text, taskType: TaskType.REPEAT, taskMode: TaskMode.SYNC }).catch((e) => {
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
    if (v === 'text_mode') {
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
    <div className={`${belanosima.className} w-[90vw] sm:w-[800px] mx-auto flex flex-col gap-4`}>
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
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain'
                }}>
                <track kind="captions" />
              </video>
              <div className="flex flex-col gap-2 absolute bottom-3 right-3">
                <Button
                  className="bg-green-400 hover:bg-green-500 text-white rounded-lg text-xs sm:text-sm"
                  size="sm"
                  variant="shadow"
                  onClick={handleInterrupt}>
                  Interrupt task
                </Button>
                <Button
                  className="bg-green-400 hover:bg-green-500 text-white rounded-lg text-xs sm:text-sm"
                  size="sm"
                  variant="shadow"
                  onClick={endSession}>
                  End session
                </Button>
              </div>
            </div>
          ) : !isLoadingSession ? (
            <div className="h-full justify-center items-center flex flex-col gap-4 sm:gap-8 w-full self-center">
              <div className="flex flex-col gap-4 w-full">
                <p className="text-sm font-medium leading-none">Upload files(OPTIONAL)</p>
                <div
                  className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-3 sm:p-4 text-center cursor-pointer hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
                  onClick={() => document.getElementById('file-upload')?.click()}>
                  <div className="flex flex-col items-center justify-center gap-2">
                    <svg
                      className="w-6 h-6 sm:w-8 sm:h-8 text-gray-500 dark:text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                    <div className="flex flex-col items-center">
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                        Click or drag files here to upload
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Support PDF, PPT format</p>
                    </div>
                  </div>
                  <input
                    id="file-upload"
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const fileType = file.name.toLowerCase().split('.').pop();
                        if (!['pdf', 'ppt', 'pptx'].includes(fileType || '')) {
                          alert('Please upload a PDF or PPT file');
                          e.target.value = '';
                          return;
                        }
                        console.log('Selected file:', file);
                      }
                    }}
                    accept=".pdf,.ppt,.pptx"
                  />
                </div>

                <p className="text-sm font-medium leading-none">FULL PROMPT</p>
                <Textarea
                  placeholder="Enter a custom knowledgeBase"
                  minRows={5}
                  maxRows={10}
                  value={knowledgeBase}
                  onChange={(e) => setKnowledgeBase(e.target.value)}
                />

                <p className="text-sm font-medium leading-none">CUSTOM AVATAR</p>
                <RadioGroup
                  color="success"
                  orientation="horizontal"
                  value={avatarId}
                  onValueChange={setAvatarId}
                  classNames={{
                    wrapper: 'gap-10 justify-center items-center flex-wrap'
                  }}>
                  {AVATARS.map((ava) => (
                    <div
                      key={ava.avatar_id}
                      className="flex flex-col justify-center items-center cursor-pointer"
                      onClick={() => setAvatarId(ava.avatar_id)}>
                      <Image
                        isBlurred
                        alt={ava.name}
                        className="object-cover rounded-lg transition-transform hover:scale-105"
                        src={ava.avatar}
                        width={100}
                        height={100}
                      />
                      <Radio value={ava.avatar_id} className="text-xs sm:text-sm mt-2">
                        {ava.name}
                      </Radio>
                    </div>
                  ))}
                </RadioGroup>

                <p className="text-sm font-medium leading-none">SELECT LANGUAGE</p>
                <RadioGroup
                  color="success"
                  orientation="horizontal"
                  value={language}
                  onValueChange={setLanguage}
                  className="items-center">
                  {STT_LANGUAGE_LIST.map((lang) => (
                    <Radio value={lang.key} key={lang.key} className="text-xs sm:text-sm">
                      {lang.label}
                    </Radio>
                  ))}
                </RadioGroup>
              </div>
              <Button
                className="bg-green-400 hover:bg-green-500 w-full text-white text-sm sm:text-base"
                size="md"
                variant="shadow"
                onClick={startSession}>
                Start session
              </Button>
            </div>
          ) : (
            <Spinner color="success" size="lg" className="mt-10" />
          )}
        </CardBody>

        <Divider />

        <CardFooter className="flex flex-col items-start gap-4 relative p-3 sm:p-5">
          <Tabs
            variant="underlined"
            aria-label="Options"
            selectedKey={chatMode}
            classNames={{
              tabList: 'gap-6',
              cursor: 'bg-green-400',
              tab: 'max-w-fit px-0 h-12'
            }}
            onSelectionChange={(v) => {
              handleChangeChatMode(v);
            }}>
            <Tab key="text_mode" title="Text mode" />
            <Tab key="voice_mode" title="Voice mode" />
          </Tabs>
          {chatMode === 'text_mode' ? (
            <div className="w-full flex relative">
              <InteractiveAvatarTextInput
                disabled={!stream}
                input={text}
                label=""
                loading={isLoadingRepeat}
                placeholder="Type something for the avatar to respond"
                setInput={setText}
                onSubmit={handleSpeak}
              />
              {text && <Chip className="absolute right-16 top-3 bg-green-400 text-white">Listening</Chip>}
            </div>
          ) : (
            <div className="w-full text-center">
              <Button
                isDisabled={!isUserTalking}
                className="bg-green-400 hover:bg-green-500 text-white"
                size="md"
                variant="shadow">
                {isUserTalking ? 'Listening' : 'Voice chat'}
              </Button>
            </div>
          )}
        </CardFooter>

        <hr className="border-dashed" />

        <div className="w-full p-3 sm:p-5">
          <div className="w-full flex items-center justify-between">
            <span className="text-sm sm:text-base">OUTPUT REPORT</span>
            <Button isIconOnly className="bg-green-400 hover:bg-green-500 text-white" size="sm" variant="shadow">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
            </Button>
          </div>

          <div className="w-full border border-dashed rounded-lg mt-2 p-2">
            <p className="text-sm">
              1. Meeting Purpose: Report on the current progress of the project and discuss the problems and challenges
              encountered. Adjust the project plan to ensure that the goals are completed on time. Determine the focus
              and responsibility allocation for the next stage.
            </p>
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
