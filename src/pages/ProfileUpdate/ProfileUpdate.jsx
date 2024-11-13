import React, { useContext, useEffect, useState } from 'react';
import './ProfileUpdate.css';
import assets from '../../assets/assets';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../../config/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import upload from '../../lib/upload';
import { AppContext } from '../../context/AppContext';

const ProfileUpdate = () => {
  const navigate = useNavigate();
  const [image, setImage] = useState(null);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [uid, setUid] = useState("");
  const [prevImage, setPrevImage] = useState("");
  const { setUserData } = useContext(AppContext);

  const profileUpdate = async (event) => {
    event.preventDefault();
    try {
      if (!prevImage && !image) {
        toast.error("Upload Profile picture");
        return;
      }
      
      const docRef = doc(db, 'users', uid);
      let imgUrl = prevImage;

      if (image) {
        imgUrl = await upload(image);
        setPrevImage(imgUrl);  // Update local state
        await updateDoc(docRef, {
          avatar: imgUrl,
          bio: bio,
          name: name
        });
      } else {
        await updateDoc(docRef, { 
          bio: bio,
          name: name
        });
      }

      const snap = await getDoc(docRef);
      setUserData(snap.data());

      navigate('/chat');

      setImage(null);
      setName("");
      setBio("");
    } catch (error) {
      console.error(error);
      toast.error(error.message);
    }
  };

  useEffect(() => {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUid(user.uid);
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const userData = docSnap.data();
          setName(userData.name || "");
          setBio(userData.bio || "");
          setPrevImage(userData.avatar || "");
        }
      } else {
        navigate('/');
      }
    });
  }, [navigate]);

  return (
    <div className="profile">
      <div className="profile-container">
        <form onSubmit={profileUpdate}>
          <h3>Profile Details</h3>
          <label htmlFor="avatar"> 
            <input onChange={(e) => setImage(e.target.files[0])} type="file" id='avatar' accept='.png,.jpg,.jpeg' hidden />
            <img src={image ? URL.createObjectURL(image) : prevImage || assets.avatar_icon} alt="Profile Preview" />
            Upload Profile Image
          </label>
          <input onChange={(e) => setName(e.target.value)} value={name} type="text" placeholder='Your name' required />
          <textarea onChange={(e) => setBio(e.target.value)} value={bio} placeholder='Write profile bio' required></textarea>
          <button type='submit'>Save</button>
        </form>
        <img className='profile-pic' src={image? URL.createObjectURL(image) : prevImage ? prevImage : assets.logo} alt="Current Profile" />
 
      </div>
    </div>
  );
};

export default ProfileUpdate;
