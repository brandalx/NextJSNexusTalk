"use client";

import { Member, MemberRole, Profile } from "@prisma/client";
import { UserAvatar } from "../user-avatar";
import { ActionTooltip } from "../ui/action-tooltip";
import {
  Check,
  Edit,
  FileIcon,
  Loader2,
  ShieldAlert,
  ShieldCheck,
  Trash,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

import * as z from "zod";
import axios from "axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormControl, Form, FormField, FormItem } from "../ui/form";
import qs from "query-string";
import { useForm } from "react-hook-form";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { useRouter, useParams } from "next/navigation";
import { useModal } from "@/hooks/use-modal-store";
interface ChatItemProps {
  id: string;
  content: string;
  member: Member & {
    profile: Profile;
  };
  timestamp: string;
  fileUrl: string | null;
  deleted: boolean;
  currentMember: Member;
  isUpdated: boolean;
  socketUrl: string;
  socketQuery: Record<string, string>;
}

const fromSchema = z.object({
  content: z.string().min(1),
});

const roleIconMap = {
  GUEST: null,
  MODERATOR: <ShieldCheck className="h4 w-4  ml-2 text-indigo-500" />,
  ADMIN: <ShieldAlert className="h-4  w-4 ml-2 text-rose-500" />,
};

const ChatItem = ({
  id,
  content,
  currentMember,
  deleted,
  fileUrl,
  member,
  socketQuery,
  socketUrl,
  timestamp,
  isUpdated,
}: ChatItemProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const { onOpen } = useModal();
  const isAdmin = currentMember.role === MemberRole.ADMIN;
  const isModerator = currentMember.role === MemberRole.MODERATOR;
  const isOwner = currentMember.id === member.id;
  const canDeleteMessage = !deleted && (isAdmin || isModerator || isOwner);
  const fileType = fileUrl?.split(".").pop();
  const form = useForm<z.infer<typeof fromSchema>>({
    resolver: zodResolver(fromSchema),
    defaultValues: {
      content: content,
    },
  });

  useEffect(() => {
    const handleKeyDown = (event: any) => {
      if (event.key === "Escape" || event.keyCode === 27) {
        setIsEditing(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
  }, []);

  const isLoading = form.formState.isSubmitting;

  const onSubmit = async (values: z.infer<typeof fromSchema>) => {
    try {
      const url = qs.stringifyUrl({
        url: `${socketUrl}/${id}`,
        query: socketQuery,
      });
      await axios.patch(url, values);
      form.reset();
      setIsEditing(false);
    } catch (error) {
      console.log(error);
    }
  };
  const router = useRouter();
  const params = useParams();
  const onMemberClick = () => {
    if (member.id === currentMember.id) {
      return;
    }
    router.push(`/servers/${params?.serverId}/conversations/${member.id}`);
  };

  useEffect(() => {
    form.reset({
      content: content,
    });
  }, [content]);
  const canEditMessage = !deleted && isOwner && !fileUrl;
  const isPDF = fileType === "pdf" && fileUrl;
  const isImage = !isPDF && fileUrl;

  useEffect(() => {
    console.log("Is message deleted?", deleted);
    console.log("Is current member the owner?", isOwner);
    console.log("Does the message have a file URL?", !!fileUrl);
  }, []);

  const [contentHeight, setContentHeight] = useState(null);

  const contentRef = useRef(null);

  const handleEditClick = () => {
    if (contentRef.current) {
      const height = contentRef.current.offsetHeight;
      setContentHeight(height);
    }
    setIsEditing(true);
  };

  return (
    <div className="relative group flex items-center hover:bg-black/5 p-4 transition w-full  mx-2 rounded-lg ">
      <div className="group flex gap-x-2 items-start w-full">
        <div
          onClick={onMemberClick}
          className="cursor-pointer hover:drop-shadow-md transition  "
        >
          <UserAvatar src={member.profile.imageUrl} />
        </div>
        <div className="flex flex-col w-full">
          <div className="flex items-center gap-x-2">
            <div onClick={onMemberClick} className="flex items-center">
              <p className="font-semibold text-sm hover:underline cursor-pointer">
                {member.profile.name}
              </p>
              <ActionTooltip label={member.role}>
                {roleIconMap[member.role]}
              </ActionTooltip>
            </div>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {timestamp}
            </span>
          </div>
          {isImage && (
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="relative aspect-square rounded-md mt-2 overflow-hidden border flex items-center bg-secondary h-48 w-48"
            >
              <Image
                src={fileUrl}
                alt={content}
                fill
                className="object-cover"
              />
            </a>
          )}
          {isPDF && (
            <div className="relative flex items-center p-2 mt-2 rounded-md bg-background/10">
              <FileIcon className="h-10 w-10 fill-indigo-200 stroke-indigo-400" />
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreffer"
                className="ml-2 text-sm text-indigo-500 dark:text-indigo-400 hover:underline "
              >
                PDF File
              </a>
            </div>
          )}
          {!fileUrl && !isEditing && (
            <p
              ref={contentRef}
              className={cn(
                "text-sm text-zinc-600 dark:text-zinc-300",
                deleted &&
                  "italic text-zinc-500 dark:text-zinc-400 text-xs-mt-1"
              )}
            >
              {content}
              {isUpdated && !deleted && (
                <span className="text-[10px] mx-2 text-zinc-500 dark:text-zinc-400">
                  (edited)
                </span>
              )}
            </p>
          )}
          {!fileUrl && isEditing && (
            <Form {...form}>
              <form
                className="flex items-center w-full gap-x-2 pt-2"
                onSubmit={form.handleSubmit(onSubmit)}
              >
                <div className="flex flex-col w-full">
                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <div className="relative w-full">
                            <textarea
                              style={{
                                height: contentHeight
                                  ? `${contentHeight + 10}px`
                                  : "auto",
                              }}
                              disabled={isLoading}
                              className="p-2 rounded-md
                            autoExpandTextarea
                            bg-zinc-200/90 dark:bg-zinc-700/75 border-none border-0 focus-visible:ring-0 text-[12.36px] overflow-y-hidden resize-none
                            h-full w-full
                            focus-visible:ring-offset-0 text-zinc-600 dark:text-zinc-200 "
                              placeholder="Edited message"
                              {...field}
                            />
                          </div>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <div className="flex">
                    <Button
                      disabled={isLoading}
                      size="sm"
                      className="w-[80px]"
                      variant="primary"
                    >
                      Save
                      <span>
                        {!isLoading && (
                          <Check className="w-4 text-white h-4 ml-1" />
                        )}
                        {isLoading && (
                          <Loader2 className="w-4 h-4 mx-2  animate-spin" />
                        )}
                      </span>
                    </Button>

                    <Button
                      onClick={() => {
                        form.reset();
                        setIsEditing(false);
                      }}
                      disabled={isLoading}
                      size="sm"
                      className="w-[60px] ml-2"
                      variant="ghost"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </form>
              <span className="text-[10px] mt-1 text-zinc-400">
                Press escape to cancel, enter to save
              </span>
            </Form>
          )}
        </div>
      </div>
      {canDeleteMessage && (
        <div className="hidden group-hover:flex items-center gap-x-2 absolute p-1 -top-2 right-5 bg-white dark:bg-zinc-800 border rounded-sm">
          {canEditMessage && (
            <ActionTooltip label="Edit">
              <Edit
                onClick={
                  !isEditing
                    ? handleEditClick
                    : () => {
                        form.reset();
                        setIsEditing(false);
                      }
                }
                className="cursor-pointer ml-auto w-4 h-4 text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 transition"
              />
            </ActionTooltip>
          )}
          <ActionTooltip label="Delete">
            <Trash
              onClick={() =>
                onOpen("deleteMessage", {
                  apiUrl: `${socketUrl}/${id}`,
                  query: socketQuery,
                })
              }
              className="cursor-pointer ml-auto w-4 h-4 text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 transition"
            />
          </ActionTooltip>
        </div>
      )}
    </div>
  );
};

export default ChatItem;
