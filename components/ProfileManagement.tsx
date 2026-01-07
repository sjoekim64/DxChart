import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { database } from '../lib/database';

interface ProfileManagementProps {
  onBack: () => void;
  onUpdate?: () => void;
}

export const ProfileManagement: React.FC<ProfileManagementProps> = ({ onBack, onUpdate }) => {
  const { user, updateUser } = useAuth();
  const [clinicName, setClinicName] = useState('');
  const [therapistName, setTherapistName] = useState('');
  const [therapistLicenseNo, setTherapistLicenseNo] = useState('');
  const [clinicLogo, setClinicLogo] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (user) {
      setClinicName(user.clinicName || '');
      setTherapistName(user.therapistName || '');
      setTherapistLicenseNo(user.therapistLicenseNo || '');
    }

    // 클리닉 정보 로드 (로고 포함)
    const loadClinicInfo = async () => {
      if (user) {
        try {
          const clinicInfo = await database.getClinicInfo(user.id);
          if (clinicInfo) {
            setClinicLogo(clinicInfo.clinicLogo || '');
            // 클리닉 정보가 있으면 그것을 우선 사용
            if (clinicInfo.clinicName) setClinicName(clinicInfo.clinicName);
            if (clinicInfo.therapistName) setTherapistName(clinicInfo.therapistName);
            if (clinicInfo.therapistLicenseNo) setTherapistLicenseNo(clinicInfo.therapistLicenseNo);
          }
        } catch (error) {
          console.error('클리닉 정보 로드 실패:', error);
        }
      }
    };

    loadClinicInfo();
  }, [user]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setClinicLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setClinicLogo('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSaving(true);
    setMessage(null);

    try {
      // 사용자 프로필 업데이트
      const updatedUser = await database.updateUserProfile(user.id, {
        clinicName,
        therapistName,
        therapistLicenseNo,
      });

      // 클리닉 정보 저장 (로고 포함)
      await database.saveClinicInfo(user.id, {
        clinicName,
        clinicLogo,
        therapistName,
        therapistLicenseNo,
      });

      // AuthContext의 user 업데이트
      updateUser(updatedUser);

      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      
      if (onUpdate) {
        onUpdate();
      }

      // 2초 후 메시지 제거
      setTimeout(() => {
        setMessage(null);
      }, 2000);
    } catch (error) {
      console.error('프로필 업데이트 실패:', error);
      setMessage({ type: 'error', text: 'Failed to update profile. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl mx-auto">
      <div className="border-b pb-4 mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">Profile Management</h2>
        <p className="text-sm text-gray-600 mt-1">Update your clinic information and therapist details</p>
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded-md ${
          message.type === 'success' 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="clinicName" className="block text-sm font-medium text-gray-700 mb-1">
            Clinic Name
          </label>
          <input
            type="text"
            id="clinicName"
            value={clinicName}
            onChange={(e) => setClinicName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            required
          />
        </div>

        <div>
          <label htmlFor="clinicLogo" className="block text-sm font-medium text-gray-700 mb-1">
            Clinic Logo
          </label>
          <input
            type="file"
            id="clinicLogo"
            accept="image/*"
            onChange={handleLogoChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
          {clinicLogo && (
            <div className="mt-2">
              <img src={clinicLogo} alt="Clinic Logo" className="max-h-20 max-w-full object-contain" />
            </div>
          )}
        </div>

        <div>
          <label htmlFor="therapistName" className="block text-sm font-medium text-gray-700 mb-1">
            Therapist Name
          </label>
          <input
            type="text"
            id="therapistName"
            value={therapistName}
            onChange={(e) => setTherapistName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            required
          />
        </div>

        <div>
          <label htmlFor="therapistLicenseNo" className="block text-sm font-medium text-gray-700 mb-1">
            License Number
          </label>
          <input
            type="text"
            id="therapistLicenseNo"
            value={therapistLicenseNo}
            onChange={(e) => setTherapistLicenseNo(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            required
          />
        </div>

        <div className="flex justify-end space-x-4 pt-4 border-t">
          <button
            type="button"
            onClick={onBack}
            className="px-6 py-2 bg-gray-600 text-white font-semibold rounded-lg shadow-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200"
          >
            Back
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200 disabled:bg-indigo-400 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

