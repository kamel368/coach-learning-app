import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp, collection } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { GraduationCap, Building2, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';

export default function RegisterPage() {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    companyName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function generateSlug(name) {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      + '-' + Date.now().toString(36);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    
    if (!formData.companyName.trim()) {
      setError('Le nom de l\'entreprise est requis');
      return;
    }
    if (!formData.email.trim()) {
      setError('L\'email est requis');
      return;
    }
    if (formData.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }
    
    setLoading(true);
    
    try {
      // 1. Créer le compte Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email.trim(),
        formData.password
      );
      const user = userCredential.user;
      
      // 2. Générer l'ID et slug de l'organisation
      const orgRef = doc(collection(db, 'organizations'));
      const orgId = orgRef.id;
      const orgSlug = generateSlug(formData.companyName);
      
      // 3. Créer l'organisation
      await setDoc(orgRef, {
        name: formData.companyName.trim(),
        slug: orgSlug,
        status: 'active',
        createdAt: serverTimestamp(),
        createdBy: user.uid,
        info: {
          name: formData.companyName.trim(),
          email: user.email,
          logoUrl: null,
          createdAt: serverTimestamp()
        },
        modules: ['learning'],
        settings: {
          maxEmployees: 50,
          features: ['learning']
        }
      });
      
      // 4. Créer l'employee (admin de l'organisation)
      await setDoc(
        doc(db, 'organizations', orgId, 'employees', user.uid),
        {
          profile: {
            oderId: user.uid,
            email: user.email,
            firstName: '',
            lastName: '',
            role: 'admin',
            status: 'active',
            poste: '',
            contrat: '',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          }
        }
      );
      
      // 5. Créer le document learning/data
      await setDoc(
        doc(db, 'organizations', orgId, 'employees', user.uid, 'learning', 'data'),
        {
          assignedPrograms: [],
          lastActivityAt: serverTimestamp()
        }
      );
      
      // 6. Créer dans /users pour compatibilité
      await setDoc(doc(db, 'users', user.uid), {
        oderId: user.uid,
        email: user.email,
        displayName: formData.companyName.trim(),
        role: 'admin',
        organizationId: orgId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      console.log('✅ Organisation créée:', orgId);
      navigate('/admin');
      
    } catch (err) {
      console.error('Erreur inscription:', err);
      
      if (err.code === 'auth/email-already-in-use') {
        setError('Cet email est déjà utilisé.');
      } else if (err.code === 'auth/invalid-email') {
        setError('L\'email n\'est pas valide.');
      } else if (err.code === 'auth/weak-password') {
        setError('Le mot de passe est trop faible.');
      } else {
        setError('Une erreur est survenue. Veuillez réessayer.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '24px',
        padding: '40px',
        width: '100%',
        maxWidth: '440px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px'
          }}>
            <GraduationCap size={32} color="white" />
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#1e293b', marginBottom: '8px' }}>
            Coach Learning
          </h1>
          <p style={{ color: '#64748b', fontSize: '15px' }}>
            Créez votre espace de formation
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
              Nom de votre entreprise
            </label>
            <div style={{ position: 'relative' }}>
              <Building2 size={18} color="#9ca3af" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                placeholder="Ma Société"
                style={{
                  width: '100%',
                  padding: '12px 14px 12px 44px',
                  borderRadius: '12px',
                  border: '2px solid #e5e7eb',
                  fontSize: '15px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
              Votre email
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} color="#9ca3af" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="vous@entreprise.com"
                style={{
                  width: '100%',
                  padding: '12px 14px 12px 44px',
                  borderRadius: '12px',
                  border: '2px solid #e5e7eb',
                  fontSize: '15px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
              Mot de passe
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} color="#9ca3af" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: '12px 44px 12px 44px',
                  borderRadius: '12px',
                  border: '2px solid #e5e7eb',
                  fontSize: '15px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                {showPassword ? <EyeOff size={18} color="#9ca3af" /> : <Eye size={18} color="#9ca3af" />}
              </button>
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
              Confirmer le mot de passe
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} color="#9ca3af" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: '12px 14px 12px 44px',
                  borderRadius: '12px',
                  border: '2px solid #e5e7eb',
                  fontSize: '15px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          {error && (
            <div style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '12px',
              padding: '12px 16px',
              marginBottom: '20px',
              color: '#dc2626',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              background: loading ? '#94a3b8' : 'linear-gradient(135deg, #667eea, #764ba2)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            {loading ? 'Création en cours...' : 'Créer mon espace'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '24px', color: '#64748b', fontSize: '14px' }}>
          Déjà un compte ?{' '}
          <Link to="/login" style={{ color: '#667eea', fontWeight: '600', textDecoration: 'none' }}>
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
