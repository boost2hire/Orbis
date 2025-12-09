export const handleChat = (res: any) => {
  return {
    reply: res.say || res.reply || "Okay.",
  };
};
