import React from 'react';
import { ChevronRight, Camera, UserCog, Users, Image as ImageIcon } from 'lucide-react';
import { UserProfile } from '../../types';

interface ProfileHeaderProps {
  profile: UserProfile | null;
  isEditing: boolean;
  onUpdateProfile: () => void;
  onPhotoChange: (file: File) => void;
  onCancelEdit: () => void;
  onStartEdit: () => void;
  onBack: () => void;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  profile,
  isEditing,
  onUpdateProfile,
  onPhotoChange,
  onCancelEdit,
  onStartEdit,
  onBack
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleGalleryClick = () => {
    if (isEditing && fileInputRef.current) {
      fileInputRef.current.removeAttribute('capture');
      fileInputRef.current.click();
    }
  };

  const handleCameraClick = () => {
    if (isEditing && fileInputRef.current) {
      fileInputRef.current.setAttribute('capture', 'user');
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onPhotoChange(file);
    }
  };

  return (
    <>
      {/* Header / Cover */}
      <div className="h-48 bg-slate-100 relative overflow-hidden">
        <button 
          onClick={onBack}
          className="absolute top-6 left-6 w-10 h-10 bg-white/80 backdrop-blur-md rounded-2xl flex items-center justify-center text-slate-600 hover:bg-white transition-all shadow-sm"
          aria-label="Retour"
        >
          <ChevronRight className="rotate-180" size={20} />
        </button>
      </div>

      {/* Profile Info */}
      <div className="max-w-4xl mx-auto px-6 -mt-20 relative z-10">
        <div className="bg-white rounded-[40px] shadow-2xl shadow-slate-200/50 p-8 border border-slate-50">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-8">
            <div className="relative group">
              <div className="w-40 h-40 rounded-[32px] bg-slate-50 overflow-hidden border-4 border-white shadow-xl group-hover:scale-[1.02] transition-transform duration-500">
                {profile?.photoURL ? (
                  <img src={profile.photoURL} alt={profile.displayName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-200">
                    <Users size={64} />
                  </div>
                )}
              </div>
              {isEditing && (
                <div className="flex flex-col gap-2 absolute -bottom-2 -right-2">
                  <button 
                    onClick={handleCameraClick}
                    className="w-10 h-10 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                    aria-label="Prendre une photo"
                    title="Prendre une photo"
                  >
                    <Camera size={18} />
                  </button>
                  <button 
                    onClick={handleGalleryClick}
                    className="w-10 h-10 bg-white text-indigo-600 border-2 border-indigo-100 rounded-2xl flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                    aria-label="Choisir dans la galerie"
                    title="Choisir dans la galerie"
                  >
                    <ImageIcon size={18} />
                  </button>
                </div>
              )}
              <input 
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
            </div>

            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
                <h1 className="text-4xl font-black text-slate-800 tracking-tight">
                  {profile?.displayName}
                </h1>
                <div className="flex items-center justify-center md:justify-start gap-2">
                  {profile?.isAdmin && (
                    <span className="bg-indigo-600 text-white text-[10px] font-black px-3 py-1 rounded-full tracking-widest uppercase shadow-sm">ADMIN</span>
                  )}
                  {profile?.badges?.includes('pioneer') && (
                    <span className="bg-purple-100 text-purple-600 text-[10px] font-black px-3 py-1 rounded-full tracking-widest uppercase">PIONNIER</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              {isEditing ? (
                <button 
                  onClick={onCancelEdit}
                  className="px-8 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black hover:bg-slate-200 transition-all"
                >
                  FERMER
                </button>
              ) : (
                <button 
                  onClick={onStartEdit}
                  className="w-14 h-14 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center hover:bg-indigo-50 hover:text-indigo-600 transition-all group"
                  aria-label="Modifier la photo"
                >
                  <Camera size={24} className="group-hover:rotate-12 transition-transform" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfileHeader;
