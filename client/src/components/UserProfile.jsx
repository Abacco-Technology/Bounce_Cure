import React, { useState, useEffect, useContext } from "react";
import {
  updateEmail,
  updateName,
  uploadProfileImage,
  getUser,
} from "../services/authService.js";
import { User, Mail, Camera, Upload, Edit3, Check } from "lucide-react";
import { UserContext } from "./UserContext"; // 👈 import context
import toast from "react-hot-toast";

const API_URL = import.meta.env.VITE_VRI_URL;

const UserProfile = () => {
  const { user, setUser } = useContext(UserContext); // 👈 use context
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [loadingName, setLoadingName] = useState(false);
  const [loadingUpload, setLoadingUpload] = useState(false);

  // useEffect(() => {
  //   const fetchUser = async () => {
  //     try {
  //       const { data } = await getUser();

  //       // const imageUrl = data.profileImage
  //       //   ? `${API_URL}/auth/profile-image/${data.id}?ts=${Date.now()}`
  //       //   : "";

  //       setUser({
  //         name: `${data.firstName} ${data.lastName}`,
  //         email: data.email,
  //         profileImage: data.profileImage,
  //       });

  //       setName(`${data.firstName} ${data.lastName}`);
  //       setEmail(data.email);

  //       setPreview(data.profileImage);

  //       console.log("User data fetched:", data);
  //       toast.success("User Data Fetched");
  //     } catch (err) {
  //       console.log("Error fetching user:", err.response?.data || err.message);
  //       toast.error("Error Fetching User");
  //     }
  //   };

  //   fetchUser();
  // }, [setUser]);


  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data } = await getUser();

        const imageSrc = data.profileImage
          ? data.profileImage.startsWith("data:image")
            ? data.profileImage // ✅ base64 from backend
            : `${API_URL}/api/auth/profile-image/${data.id}?ts=${Date.now()}` // ✅ normal URL
          : "";

        setUser({
          name: `${data.firstName} ${data.lastName}`,
          email: data.email,
          profileImage: imageSrc,
        });

        setName(`${data.firstName} ${data.lastName}`);
        setEmail(data.email);
        setPreview(imageSrc);

        console.log("User data fetched:", data);
        toast.success("User Data Fetched");
      } catch (err) {
        console.log("Error fetching user:", err.response?.data || err.message);
        toast.error("Error Fetching User");
      }
    };

    fetchUser();
  }, [setUser]);


  const handleEmailUpdate = async () => {
    setLoadingEmail(true);
    try {
      const { data } = await updateEmail(email);
      setUser((prev) => ({
        ...prev,
        email: data.email,
      }));
      toast.success("Email updated!");
    } catch (err) {
      console.log("Email update error:", err.response?.data || err.message);
      toast.error("Email Update Error!")
    } finally {
      setLoadingEmail(false);
    }
  };

  const handleNameUpdate = async () => {
    setLoadingName(true);
    try {
      const [firstName, ...rest] = name.trim().split(" ");
      const lastName = rest.join(" ");
      const { data } = await updateName({ firstName, lastName });

      setUser((prev) => ({
        ...prev,
        name: `${data.firstName} ${data.lastName}`,
      }));

      setName(`${data.firstName} ${data.lastName}`);
      toast.success("Name Updated!");
    } catch (err) {
      console.log("Name update error:", err.response?.data || err.message);
      toast.error("Name Update Error")
    } finally {
      setLoadingName(false);
    }
  };
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);

    // Show instant local preview (no wait)
    setPreview(URL.createObjectURL(selectedFile));
  };

  const handleUpload = async () => {
    if (!file) return alert("Select a file first");
    setLoadingUpload(true);

    try {
      const { data } = await uploadProfileImage(file);

      toast.success("Profile Image Uploaded!");

      // 🔥 refresh user data immediately
      await getUser();
    } catch (err) {
      console.log("Upload error:", err.response?.data || err.message);
      toast.error("Image Upload Error");
    } finally {
      setLoadingUpload(false);
    }
  };




  return (
    <div className="relative group">
      <div className="absolute -inset-0.5 bg-gradient-to-r from-white/20 to-gray-400/20 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-1000"></div>
      <div className="relative bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-white/5 rounded-lg backdrop-blur-sm">
            <User className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white">Profile Settings</h2>
        </div>

        {/* Profile Image Section */}
        <div className="text-center mb-8">
          <div className="relative inline-block group/avatar">
            <div className="absolute -inset-1 bg-gradient-to-r from-white/30 to-gray-400/30 rounded-full blur opacity-0 group-hover/avatar:opacity-100 transition duration-300"></div>
            <div className="relative">
              {preview ? (
                <img
                  src={preview}
                  alt="Profile Preview"
                  className="w-32 h-32 object-cover rounded-full border-4 border-white/20 shadow-2xl"
                />
              ) : (
                <div className="w-32 h-32 bg-white/10 rounded-full border-4 border-white/20 flex items-center justify-center">
                  <User className="w-16 h-16 text-gray-400" />
                </div>
              )}
              <div className="absolute -bottom-2 -right-2 p-2 bg-white/10 rounded-full border border-white/20 backdrop-blur-sm">
                <Camera className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>

          {/* File Upload */}
          <div className="mt-6 space-y-4">
            <div className="relative">
              <input
                type="file"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                accept="image/*"
              />
              <div className="bg-white/5 border-2 border-dashed border-white/20 rounded-xl p-4 hover:bg-white/10 hover:border-white/30 transition-all duration-300 cursor-pointer">
                <Upload className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-300 text-sm">Click to select image</p>
                <p className="text-gray-500 text-xs mt-1">PNG, JPG up to 10MB</p>
              </div>
            </div>

            {file && (
              <button
                onClick={handleUpload}
                disabled={loadingUpload}
                className="group/btn relative overflow-hidden bg-white/5 hover:bg-white/10 disabled:bg-gray-500/20 border border-white/20 hover:border-white/40 disabled:border-gray-500/20 text-white disabled:text-gray-400 py-3 px-6 rounded-xl font-semibold transition-all duration-300 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
              >
                {loadingUpload ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white"></div>
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>Upload Image</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        <div className="space-y-8">
          {/* Email Section */}
          <div className="space-y-4">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-300">
              <Mail className="w-4 h-4" />
              Email Address
            </label>
            <div className="space-y-3">
              <div className="relative group/input">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-white/10 to-gray-400/10 rounded-xl opacity-0 group-focus-within/input:opacity-100 transition duration-300"></div>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                    <Mail className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-black/30 border border-white/10 rounded-xl pl-12 pr-4 py-4 text-white placeholder-gray-500 focus:border-white/30 focus:bg-black/50 focus:outline-none transition-all duration-300"
                    placeholder="Enter your email"
                  />
                </div>
              </div>
              <button
                onClick={handleEmailUpdate}
                disabled={loadingEmail || email === user.email}
                className="group/btn relative overflow-hidden bg-white/5 hover:bg-white/10 disabled:bg-gray-500/20 border border-white/20 hover:border-white/40 disabled:border-gray-500/20 text-white disabled:text-gray-400 py-3 px-6 rounded-xl font-semibold transition-all duration-300 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loadingEmail ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white"></div>
                    <span>Updating...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Update Email</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Name Section */}
          <div className="space-y-4">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-300">
              <User className="w-4 h-4" />
              Full Name
            </label>
            <div className="space-y-3">
              <div className="relative group/input">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-white/10 to-gray-400/10 rounded-xl opacity-0 group-focus-within/input:opacity-100 transition duration-300"></div>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                    <User className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-black/30 border border-white/10 rounded-xl pl-12 pr-4 py-4 text-white placeholder-gray-500 focus:border-white/30 focus:bg-black/50 focus:outline-none transition-all duration-300"
                    placeholder="Enter your name"
                  />
                </div>
              </div>
              <button
                onClick={handleNameUpdate}
                disabled={loadingName || name === user.name}
                className="group/btn relative overflow-hidden bg-white/5 hover:bg-white/10 disabled:bg-gray-500/20 border border-white/20 hover:border-white/40 disabled:border-gray-500/20 text-white disabled:text-gray-400 py-3 px-6 rounded-xl font-semibold transition-all duration-300 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loadingName ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white"></div>
                    <span>Updating...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Update Name</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Profile Info Card */}
        <div className="mt-8 bg-white/5 border border-white/10 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
            <Edit3 className="w-4 h-4" />
            Profile Information
          </h3>
          <div className="space-y-2 text-xs text-gray-400">
            <p>• Changes to your email may require verification</p>
            <p>• Profile images should be square for best results</p>
            <p>• All changes are saved automatically to your account</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
