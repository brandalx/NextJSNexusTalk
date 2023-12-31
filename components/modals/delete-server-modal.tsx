"use client";

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogHeader,
  DialogFooter,
} from "@/components/ui/dialog";

import { useModal } from "@/hooks/use-modal-store";

import { Button } from "../ui/button";

import { useState } from "react";
import axios from "axios";
import { DialogDescription } from "@radix-ui/react-dialog";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export const DeleteServerModal = () => {
  const { isOpen, onClose, type, data } = useModal();

  const isModalOpen = isOpen && type === "deleteServer";
  const { server } = data;
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const onClick = async () => {
    try {
      setIsLoading(true);
      await axios.delete(`/api/servers/${server?.id}`);
      onClose();
      router.refresh();
      router.push("/");
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={onClose}>
      <DialogContent className="dark:bg-zinc-700/75   text-black dark:text-zinc-200 bg-white  p-0 overflow-hidden">
        <DialogHeader className="pt-8 px-6 ">
          <DialogTitle className="text-2xl text-center font-bold">
            Delete Server
          </DialogTitle>
          <DialogDescription className="text-center text-zinc-400">
            Are you sure you want to do this?{" "}
            <span className="font-semibold text-indigo-500">
              {server?.name}{" "}
            </span>{" "}
            will be permamently{" "}
            <span className="font-semibold text-rose-600 ">deleted </span>{" "}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="px-6 py-4">
          <div className="flex items-center justify-between w-full">
            <Button disabled={isLoading} onClick={onClose} variant="ghost">
              Cancel
            </Button>
            <Button disabled={isLoading} variant="primary" onClick={onClick}>
              {!isLoading ? "Confirm" : "Deleting"}
              {isLoading && <Loader2 className="w-4 h-4 mx-2  animate-spin" />}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
