export interface PhotoResponse {
  type: "PHOTO";
  path: string;
}

export const handlePhoto = (res: PhotoResponse) => {
  console.log("📸 Photo captured:", res.path);

  return {
    file: res.path,
    url: `http://127.0.0.1:5001/captures/${res.path}`,
  };
};
