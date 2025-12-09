export const handleQR = (res: any) => {
  return {
    qr: res.qr || res.qr_base64 || null,
  };
};
