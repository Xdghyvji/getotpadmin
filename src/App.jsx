import React, { useState, useEffect, useRef, createContext, useContext } from 'react';

// --- FIREBASE IMPORTS ---
import { initializeApp } from 'firebase/app';
import { 
    getAuth, 
    onAuthStateChanged,
    signOut,
    signInWithEmailAndPassword
} from 'firebase/auth';
import { 
    getFirestore, 
    doc, 
    getDoc, 
    collection,
    onSnapshot,
    query,
    addDoc,
    updateDoc,
    deleteDoc,
    writeBatch,
    where,
    getDocs,
    collectionGroup
} from 'firebase/firestore';


// --- FIREBASE CONFIGURATION ---
const firebaseConfig = {
    apiKey: "AIzaSyBVruE0hRVZisHlnnyuWBl-PZp3-DMp028",
    authDomain: "pakages-provider.firebaseapp.com",
    projectId: "pakages-provider",
    storageBucket: "pakages-provider.appspot.com",
    messagingSenderId: "109547136506",
    appId: "1:109547136506:web:c9d34657d73b0fcc3ef043",
    measurementId: "G-672LC3842S"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- CURRENCY CONTEXT ---
const CurrencyContext = createContext();

const conversionRates = {
    USD: { rate: 1, symbol: '$' },
    PKR: { rate: 278, symbol: 'Rs' },
    INR: { rate: 83, symbol: '₹' },
};

const CurrencyProvider = ({ children }) => {
    const [currency, setCurrency] = useState('USD');

    const convertCurrency = (amountInUsd) => {
        if (typeof amountInUsd !== 'number') return '0.00';
        const { rate } = conversionRates[currency];
        return (amountInUsd * rate).toFixed(2);
    };

    const currencySymbol = conversionRates[currency].symbol;

    return (
        <CurrencyContext.Provider value={{ currency, setCurrency, convertCurrency, currencySymbol }}>
            {children}
        </CurrencyContext.Provider>
    );
};

const useCurrency = () => useContext(CurrencyContext);


// --- ICONS (using inline SVGs for simplicity) ---
const DashboardIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>;
const UsersIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>;
const BlockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>;
const SearchIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>;
const PlusCircleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>;
const ListIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>;
const ServerIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect><rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect><line x1="6" y1="6" x2="6.01" y2="6"></line><line x1="6" y1="18" x2="6.01" y2="18"></line></svg>;
const CodeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>;
const DollarSignIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>;
const SettingsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>;
const MenuIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>;
const ShoppingCartIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>;
const TrendingUpIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>;
const TrendingDownIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline><polyline points="17 18 23 18 23 12"></polyline></svg>;
const ClockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>;
const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>;
const XCircleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>;

// --- Reusable UI Components ---
const Card = ({ children, className = '' }) => <div className={`bg-white rounded-lg shadow-sm ${className}`}>{children}</div>;
const Button = ({ children, onClick, className = '', ...props }) => <button onClick={onClick} className={`px-4 py-2 font-semibold rounded-md shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 disabled:opacity-50 ${className}`} {...props}>{children}</button>;
const Spinner = () => <div className="flex justify-center items-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null;
    const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
    return (
        <div className="flex justify-center items-center space-x-2 mt-6 p-4">
            <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="px-3 py-1 border rounded-md disabled:opacity-50">Prev</button>
            {pages.map(page => (
                <button key={page} onClick={() => onPageChange(page)} className={`px-3 py-1 border rounded-md ${currentPage === page ? 'bg-blue-600 text-white' : ''}`}>
                    {page}
                </button>
            ))}
            <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className="px-3 py-1 border rounded-md disabled:opacity-50">Next</button>
        </div>
    );
};

// --- API Call Function ---
const apiCall = async (action, payload) => {
    try {
        const idToken = auth.currentUser ? await auth.currentUser.getIdToken() : null;
        const response = await fetch(`/.netlify/functions/api-proxy`, {
            method: 'POST',
            body: JSON.stringify({ action, payload }),
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`
            },
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error("API Call Failed:", error);
        return { error: error.message };
    }
};


// --- Admin Panel Components ---

const AdminLogin = ({ setAdmin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
            const adminDocRef = doc(db, "admins", user.uid);
            const adminDoc = await getDoc(adminDocRef);

            if (adminDoc.exists() && adminDoc.data().role === 'admin') {
                setAdmin(user);
            } else {
                setError("You do not have permission to access the admin panel.");
                await signOut(auth);
            }
        } catch (err) {
            setError("Invalid email or password.");
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
            <div className="w-full max-w-md">
                <Card className="p-8">
                    <h1 className="text-2xl font-bold text-center mb-6">GetOTP Admin Login</h1>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Email</label>
                            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Password</label>
                            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
                        </div>
                        {error && <p className="text-red-500 text-sm">{error}</p>}
                        <Button type="submit" className="w-full" disabled={loading}>{loading ? <Spinner/> : 'Login'}</Button>
                    </form>
                </Card>
            </div>
        </div>
    );
};

const StatCard = ({ title, value, icon, change, changeType }) => {
    const { convertCurrency, currencySymbol } = useCurrency();
    const displayValue = title.toLowerCase().includes('amount') || title.toLowerCase().includes('recharge') 
        ? `${currencySymbol} ${convertCurrency(value)}` 
        : value;

    return (
        <Card className="p-4">
            <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
                    {icon}
                </div>
                <div>
                    <p className="text-sm font-medium text-gray-500">{title}</p>
                    <p className="text-2xl font-bold">{displayValue}</p>
                </div>
            </div>
            {change && (
                <div className={`mt-2 text-xs flex items-center ${changeType === 'increase' ? 'text-green-600' : 'text-red-600'}`}>
                    {changeType === 'increase' ? <TrendingUpIcon className="w-4 h-4" /> : <TrendingDownIcon className="w-4 h-4" />}
                    <span className="ml-1">{change}</span>
                </div>
            )}
        </Card>
    );
};

const DashboardPage = () => {
    const [stats, setStats] = useState({ totalUsers: 0, totalRecharge: 0, totalOtpSellAmount: 0 });
    const [topUsers, setTopUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const { convertCurrency, currencySymbol } = useCurrency();

    useEffect(() => {
        const unsubUsers = onSnapshot(collection(db, "users"), async (snapshot) => {
            const usersData = await Promise.all(snapshot.docs.map(async (doc) => {
                const userData = { id: doc.id, ...doc.data() };
                // Fetch and sum all transactions
                const transactionsSnapshot = await getDocs(collection(db, "users", userData.id, "transactions"));
                const totalRecharge = transactionsSnapshot.docs.reduce((sum, transDoc) => sum + (transDoc.data().amount || 0), 0);
                // Fetch and sum all orders
                const ordersSnapshot = await getDocs(collection(db, "users", userData.id, "orders"));
                const totalOtpBuy = ordersSnapshot.docs.reduce((sum, orderDoc) => sum + (orderDoc.data().price || 0), 0);
                return { ...userData, totalRecharge, totalOtpBuy };
            }));

            const totalUsers = usersData.length;
            const totalRecharge = usersData.reduce((acc, user) => acc + (user.totalRecharge || 0), 0);
            const totalOtpSellAmount = usersData.reduce((acc, user) => acc + (user.totalOtpBuy || 0), 0);
            const sortedUsers = [...usersData].sort((a, b) => b.balance - a.balance).slice(0, 5);

            setStats({ totalUsers, totalRecharge, totalOtpSellAmount });
            setTopUsers(sortedUsers);
            setLoading(false);
        });

        return () => unsubUsers();
    }, []);

    if (loading) return <Spinner />;

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard title="TOTAL USER" value={stats.totalUsers} icon={<UsersIcon />} />
                <StatCard title="TOTAL RECHARGE AMOUNT" value={stats.totalRecharge} icon={<ShoppingCartIcon />} />
                <StatCard title="TOTAL OTP SELL AMOUNT" value={stats.totalOtpSellAmount} icon={<DollarSignIcon />} />
                <StatCard title="TOTAL OTP SELL" value="194" icon={<TrendingUpIcon />} /> {/* Placeholder as there is no field to count this in the orders collection */}
            </div>
            <Card>
                <div className="p-4"><h2 className="text-xl font-bold">Top Users by Balance</h2></div>
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Balance</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {topUsers.map((user, index) => (
                                <tr key={index}>
                                    <td className="px-6 py-4">{index + 1}</td>
                                    <td className="px-6 py-4">{user.email}</td>
                                    <td className="px-6 py-4">{currencySymbol} {convertCurrency(user.balance)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

const EditUserModal = ({ user, onClose, onSave }) => {
    const [balance, setBalance] = useState(user.balance || 0);
    const [loading, setLoading] = useState(false);
    const { convertCurrency, currencySymbol } = useCurrency();

    const handleSave = async () => {
        setLoading(true);
        await onSave(user.id, { balance: parseFloat(balance) });
        setLoading(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <Card className="w-full max-w-md p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Edit User</h2>
                    <button onClick={onClose}><XCircleIcon /></button>
                </div>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium">Email</label>
                        <input value={user.email} disabled className="w-full mt-1 border-gray-300 rounded-md bg-gray-100" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Balance (in USD)</label>
                        <input type="number" step="0.01" value={balance} onChange={e => setBalance(e.target.value)} className="w-full mt-1 border-gray-300 rounded-md" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Total Recharge</label>
                        <input value={`${currencySymbol} ${convertCurrency(user.totalRecharge || 0)}`} disabled className="w-full mt-1 border-gray-300 rounded-md bg-gray-100" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Total OTP Buy</label>
                        <input value={`${currencySymbol} ${convertCurrency(user.totalOtpBuy || 0)}`} disabled className="w-full mt-1 border-gray-300 rounded-md bg-gray-100" />
                    </div>
                </div>
                <div className="mt-6 flex justify-end space-x-4">
                    <Button onClick={onClose} className="bg-gray-200 text-gray-800 hover:bg-gray-300">Cancel</Button>
                    <Button onClick={handleSave} disabled={loading}>{loading ? <Spinner /> : 'Save'}</Button>
                </div>
            </Card>
        </div>
    );
};


const UserTable = ({ users, onStatusChange, onEdit }) => {
    const { convertCurrency, currencySymbol } = useCurrency();
    return (
        <table className="min-w-full">
            <thead className="bg-gray-50">
                <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Balance</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                {users.map(user => (
                    <tr key={user.id}>
                        <td className="px-6 py-4">{user.displayName}</td>
                        <td className="px-6 py-4">{user.email}</td>
                        <td className="px-6 py-4">{currencySymbol} {convertCurrency(user.balance)}</td>
                        <td className="px-6 py-4">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.status === 'blocked' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                {user.status || 'active'}
                            </span>
                        </td>
                        <td className="px-6 py-4">{user.createdAt && new Date(user.createdAt.seconds * 1000).toLocaleDateString()}</td>
                        <td className="px-6 py-4 space-x-4">
                            <button onClick={() => onEdit(user)} className="text-blue-600 hover:text-blue-900"><EditIcon /></button>
                            <button onClick={() => onStatusChange(user.id, user.status === 'blocked' ? 'active' : 'blocked')} 
                                            className={`text-sm font-medium ${user.status === 'blocked' ? 'text-green-600 hover:text-green-900' : 'text-red-600 hover:text-red-900'}`}>
                                {user.status === 'blocked' ? 'Unblock' : 'Block'}
                            </button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
};

const ManageUsersPage = ({ filter }) => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingUser, setEditingUser] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        let q = collection(db, "users");
        if (filter) {
            q = query(q, where("status", "==", filter));
        }

        const unsubscribe = onSnapshot(q, async (snapshot) => {
            const usersWithStats = await Promise.all(snapshot.docs.map(async (userDoc) => {
                const userData = { id: userDoc.id, ...userDoc.data() };
                const ordersSnapshot = await getDocs(collection(db, "users", userData.id, "orders"));
                const totalOtpBuy = ordersSnapshot.docs.reduce((sum, orderDoc) => sum + (orderDoc.data().price || 0), 0);
                const transactionsSnapshot = await getDocs(collection(db, "users", userData.id, "transactions"));
                const totalRecharge = transactionsSnapshot.docs.reduce((sum, transDoc) => sum + (transDoc.data().amount || 0), 0);
                return { ...userData, totalOtpBuy, totalRecharge };
            }));
            setUsers(usersWithStats);
            setLoading(false);
        });
        
        return () => unsubscribe();
    }, [filter]);

    const handleStatusChange = async (userId, newStatus) => {
        const userDocRef = doc(db, "users", userId);
        await updateDoc(userDocRef, { status: newStatus });
    };

    const handleSaveUser = async (userId, data) => {
        const userDocRef = doc(db, "users", userId);
        await updateDoc(userDocRef, data);
    };
    
    const filteredUsers = users.filter(user => 
        (user.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (user.displayName?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
    const paginatedUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <div>
            {editingUser && <EditUserModal user={editingUser} onClose={() => setEditingUser(null)} onSave={handleSaveUser} />}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">{filter ? `${filter.charAt(0).toUpperCase() + filter.slice(1)} Users` : 'All Users'}</h1>
                <form className="w-1/3 relative">
                    <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search..." className="w-full border-gray-300 rounded-md shadow-sm pl-10" />
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                </form>
            </div>
            <Card>
                <div className="overflow-x-auto">
                    {loading ? <Spinner /> : <UserTable users={paginatedUsers} onStatusChange={handleStatusChange} onEdit={setEditingUser} />}
                </div>
                <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            </Card>
        </div>
    );
};

const FindUserPage = ({ initialSearchTerm, setPage }) => {
    const [searchTerm, setSearchTerm] = useState(initialSearchTerm || '');
    const [allUsers, setAllUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingUser, setEditingUser] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        const q = query(collection(db, "users"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setAllUsers(usersData);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const results = allUsers.filter(user =>
            (user.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (user.displayName?.toLowerCase() || '').includes(searchTerm.toLowerCase())
        );
        setFilteredUsers(results);
        setCurrentPage(1);
    }, [searchTerm, allUsers]);

    const handleStatusChange = async (userId, newStatus) => {
        const userDocRef = doc(db, "users", userId);
        await updateDoc(userDocRef, { status: newStatus });
    };

    const handleSaveUser = async (userId, data) => {
        const userDocRef = doc(db, "users", userId);
        await updateDoc(userDocRef, data);
    };

    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
    const paginatedUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <div>
            {editingUser && <EditUserModal user={editingUser} onClose={() => setEditingUser(null)} onSave={handleSaveUser} />}
            <h1 className="text-3xl font-bold mb-6">Find User</h1>
            <Card className="p-6">
                <form onSubmit={e => e.preventDefault()} className="flex space-x-4 mb-6">
                    <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Enter user email or name..." className="flex-grow border-gray-300 rounded-md" />
                </form>
                <div className="overflow-x-auto">
                    {loading ? <Spinner /> : <UserTable users={paginatedUsers} onStatusChange={handleStatusChange} onEdit={setEditingUser} />}
                </div>
                <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            </Card>
        </div>
    );
};


const ManageServicesPage = () => {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState({ services: true, sync: false });
    const [selectedServices, setSelectedServices] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const { convertCurrency, currencySymbol } = useCurrency();
    const [profitPercentage, setProfitPercentage] = useState(20);
    const [manualForm, setManualForm] = useState({ name: '', icon: '', price: '' });

    useEffect(() => {
        const unsubServices = onSnapshot(collection(db, "services"), (snapshot) => {
            setServices(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(prev => ({ ...prev, services: false }));
        });
        return () => unsubServices();
    }, []);

    const handleManualAdd = async (e) => {
        e.preventDefault();
        const { name, icon, price } = manualForm;
        if (!name || !price) return;
        await addDoc(collection(db, "services"), {
            name, icon, price: parseFloat(price), status: 'active', provider: 'manual'
        });
        setManualForm({ name: '', icon: '', price: '' });
    };

    const handleSync = async () => {
        setLoading(prev => ({ ...prev, sync: true }));
        try {
            const result = await apiCall("syncProviderData", { provider: '5sim' });

            if (result.error) {
                alert(`Sync failed: ${result.error}`);
            } else {
                alert(result.message);
            }
        } catch (error) {
            alert(`An unexpected error occurred: ${error.message}`);
        } finally {
            setLoading(prev => ({ ...prev, sync: false }));
        }
    };

    const handleSelect = (id) => {
        setSelectedServices(prev => prev.includes(id) ? prev.filter(sId => sId !== id) : [...prev, id]);
    };
    
    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedServices(services.map(s => s.id));
        } else {
            setSelectedServices([]);
        }
    };

    const handleBulkDelete = async () => {
        if (selectedServices.length === 0 || !window.confirm(`Delete ${selectedServices.length} selected services?`)) return;
        const batch = writeBatch(db);
        selectedServices.forEach(id => {
            batch.delete(doc(db, "services", id));
        });
        await batch.commit();
        setSelectedServices([]);
    };

    const filteredServices = services.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">Manage Services</h1>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-6">
                    <h2 className="text-xl font-bold mb-4">Sync from Provider</h2>
                    <p className="mb-4 text-gray-600">This will fetch all available services, countries, and prices from the provider, and store them with your specified profit margin.</p>
                    <div className="flex items-center space-x-2 mb-4">
                        <input type="number" step="1" value={profitPercentage} onChange={e => setProfitPercentage(Number(e.target.value))} placeholder="Profit %" className="w-24 border-gray-300 rounded-md"/>
                        <span>% Profit Margin</span>
                    </div>
                    <Button onClick={handleSync} className="w-full" disabled={loading.sync}>{loading.sync ? <Spinner /> : 'Sync with Provider'}</Button>
                </Card>
                <Card className="p-6">
                    <h2 className="text-xl font-bold mb-4">Add Service Manually</h2>
                    <form onSubmit={handleManualAdd} className="space-y-4">
                        <input value={manualForm.name} onChange={e => setManualForm({...manualForm, name: e.target.value})} placeholder="Service Name (e.g., Facebook)" required className="w-full border-gray-300 rounded-md"/>
                        <input value={manualForm.icon} onChange={e => setManualForm({...manualForm, icon: e.target.value})} placeholder="Emoji Icon (e.g., 👍)" className="w-full border-gray-300 rounded-md"/>
                        <input type="number" step="0.01" value={manualForm.price} onChange={e => setManualForm({...manualForm, price: e.target.value})} placeholder="Price (in USD)" required className="w-full border-gray-300 rounded-md"/>
                        <Button type="submit" className="w-full">Add Manually</Button>
                    </form>
                </Card>
            </div>
            <Card className="mt-8">
                <div className="p-4 flex justify-between items-center">
                    <h2 className="text-xl font-bold">Existing Services</h2>
                    <div className="w-1/3 relative">
                        <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search services..." className="w-full border-gray-300 rounded-md shadow-sm pl-10" />
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    </div>
                    {selectedServices.length > 0 && (
                        <Button onClick={handleBulkDelete} className="bg-red-600 hover:bg-red-700">Delete Selected ({selectedServices.length})</Button>
                    )}
                </div>
                <div className="overflow-x-auto">
                    {loading.services ? <Spinner /> : (
                        <table className="min-w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3"><input type="checkbox" onChange={handleSelectAll} /></th>
                                    <th className="px-6 py-3 text-left">Name</th>
                                    <th className="px-6 py-3 text-left">Price (USD)</th>
                                    <th className="px-6 py-3 text-left">Provider</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredServices.map(s => (
                                    <tr key={s.id} className={selectedServices.includes(s.id) ? 'bg-blue-50' : ''}>
                                        <td className="px-6 py-4"><input type="checkbox" checked={selectedServices.includes(s.id)} onChange={() => handleSelect(s.id)} /></td>
                                        <td className="px-6 py-4 flex items-center">{s.icon && <span className="mr-3 text-xl">{s.icon}</span>}{s.name}</td>
                                        <td className="px-6 py-4">{currencySymbol} {convertCurrency(s.price)}</td>
                                        <td className="px-6 py-4">{s.provider}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </Card>
        </div>
    );
};

const ManageApisPage = () => {
    const [providers, setProviders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [providerName, setProviderName] = useState('');
    const [apiKey, setApiKey] = useState('');
    const [baseUrl, setBaseUrl] = useState('');

    useEffect(() => {
        const q = query(collection(db, "api_providers"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const providersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setProviders(providersData);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleAddProvider = async (e) => {
        e.preventDefault();
        if (!providerName || !apiKey || !baseUrl) return;
        await addDoc(collection(db, "api_providers"), {
            name: providerName, apiKey: apiKey, baseUrl: baseUrl
        });
        setProviderName(''); setApiKey(''); setBaseUrl('');
    };
    
    const handleDeleteProvider = async (id) => {
        if(window.confirm("Are you sure?")) await deleteDoc(doc(db, "api_providers", id));
    };

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">Manage API Providers</h1>
            <Card className="p-6 mb-8">
                <h2 className="text-xl font-bold mb-4">Add New Provider</h2>
                <form onSubmit={handleAddProvider} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <input value={providerName} onChange={e => setProviderName(e.target.value)} placeholder="Provider Name (e.g., 5sim)" className="md:col-span-1 border-gray-300 rounded-md" />
                    <input value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="API Key" className="md:col-span-1 border-gray-300 rounded-md" />
                    <input value={baseUrl} onChange={e => setBaseUrl(e.target.value)} placeholder="Base URL" className="md:col-span-1 border-gray-300 rounded-md" />
                    <Button type="submit" className="md:col-span-1 w-full">Add Provider</Button>
                </form>
            </Card>
            <Card>
                <div className="overflow-x-auto">
                    {loading ? <Spinner /> : (
                        <table className="min-w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left">Name</th>
                                    <th className="px-6 py-3 text-left">Base URL</th>
                                    <th className="px-6 py-3 text-left">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {providers.map(provider => (
                                    <tr key={provider.id}>
                                        <td className="px-6 py-4">{provider.name}</td>
                                        <td className="px-6 py-4">{provider.baseUrl}</td>
                                        <td className="px-6 py-4"><button onClick={() => handleDeleteProvider(provider.id)} className="text-red-600 hover:text-red-900"><TrashIcon /></button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </Card>
        </div>
    );
};

const ManageServersPage = () => {
    const [servers, setServers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, "servers"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setServers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleDeleteServer = async (id) => {
        if(window.confirm("Are you sure?")) await deleteDoc(doc(db, "servers", id));
    };

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">Manage Servers (Countries)</h1>
            <Card>
                <div className="overflow-x-auto">
                    {loading ? <Spinner /> : (
                        <table className="min-w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left">Name (for API)</th>
                                    <th className="px-6 py-3 text-left">Location</th>
                                    <th className="px-6 py-3 text-left">Flag</th>
                                    <th className="px-6 py-3 text-left">Status</th>
                                    <th className="px-6 py-3 text-left">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {servers.map(server => (
                                    <tr key={server.id}>
                                        <td className="px-6 py-4">{server.name}</td>
                                        <td className="px-6 py-4">{server.location}</td>
                                        <td className="px-6 py-4">
                                            {server.iso && (
                                                <img 
                                                    src={`https://flagcdn.com/w20/${server.iso.toLowerCase()}.png`} 
                                                    alt={`Flag of ${server.location}`} 
                                                    className="w-8 h-auto inline-block"
                                                />
                                            )}
                                        </td>
                                        <td className="px-6 py-4"><span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">{server.status || 'active'}</span></td>
                                        <td className="px-6 py-4"><button onClick={() => handleDeleteServer(server.id)} className="text-red-600 hover:text-red-900"><TrashIcon /></button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </Card>
        </div>
    );
};

const NumberHistoryPage = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const { convertCurrency, currencySymbol } = useCurrency();

    useEffect(() => {
        const q = query(collectionGroup(db, "orders"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const ordersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setOrders(ordersData);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const filteredOrders = orders.filter(order =>
        (order.product?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (order.phone?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (order.userId?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
    const paginatedOrders = filteredOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    
    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">Number History</h1>
            <Card>
                <div className="p-4 flex justify-between items-center">
                    <div>
                        Show <select value={itemsPerPage} onChange={e => setItemsPerPage(Number(e.target.value))} className="mx-2 border-gray-300 rounded-md">
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                        </select> entries
                    </div>
                    <div className="w-1/3 relative">
                        <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search..." className="w-full border-gray-300 rounded-md shadow-sm pl-10" />
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    {loading ? <Spinner /> : (
                        <table className="min-w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left">Service</th>
                                    <th className="px-6 py-3 text-left">Number</th>
                                    <th className="px-6 py-3 text-left">Charge</th>
                                    <th className="px-6 py-3 text-left">Buy Time</th>
                                    <th className="px-6 py-3 text-left">User ID</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {paginatedOrders.map(order => (
                                    <tr key={order.id}>
                                        <td className="px-6 py-4">{order.product}</td>
                                        <td className="px-6 py-4">{order.phone}</td>
                                        <td className="px-6 py-4">{currencySymbol} {convertCurrency(order.price)}</td>
                                        <td className="px-6 py-4">{order.createdAt && new Date(order.createdAt.seconds * 1000).toLocaleString()}</td>
                                        <td className="px-6 py-4 text-xs">{order.userId}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
                <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            </Card>
        </div>
    );
};

const ContentPage = ({ title }) => (
    <div>
        <h1 className="text-3xl font-bold mb-6">{title}</h1>
        <Card className="p-6">
            <p>This page is under construction. Check back later for the "{title}" feature.</p>
        </Card>
    </div>
);

const sidebarItems = [
    { name: 'Dashboard', icon: <DashboardIcon />, page: 'dashboard' },
    { name: 'All Users', icon: <UsersIcon />, page: 'all_user' },
    { name: 'Blocked Users', icon: <BlockIcon />, page: 'blocked_user' },
    { name: 'Find User', icon: <SearchIcon />, page: 'find_user' },
    { name: 'Manage Services', icon: <PlusCircleIcon />, page: 'manage_services' },
    { name: 'Manage Servers', icon: <ServerIcon />, page: 'manage_servers' },
    { name: 'Manage APIs', icon: <CodeIcon />, page: 'manage_apis' },
    { name: 'Number History', icon: <ListIcon />, page: 'number_history' },
];

const Sidebar = ({ page, setPage, isSidebarOpen, setSidebarOpen }) => (
    <aside className="w-64 bg-white shadow-md flex flex-col">
        <div className="h-16 flex items-center justify-center text-2xl font-bold text-blue-600 border-b">
            Admin Panel
        </div>
        <nav className="flex-grow p-4 space-y-2 overflow-y-auto">
            {sidebarItems.map(item => (
                <a key={item.page} href="#" onClick={(e) => { e.preventDefault(); setPage(item.page); isSidebarOpen && setSidebarOpen(false); }}
                    className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${page === item.page ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}>
                    {item.icon}
                    <span>{item.name}</span>
                </a>
            ))}
        </nav>
    </aside>
);

const AdminPanel = ({ admin, setAdmin }) => {
    const [page, setPage] = useState('dashboard');
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [globalSearchTerm, setGlobalSearchTerm] = useState('');
    const { setCurrency } = useCurrency();

    const handleLogout = async () => {
        await signOut(auth);
        setAdmin(null);
    };
    
    const handleGlobalSearch = (e) => {
        e.preventDefault();
        setPage('find_user');
    };

    const renderPage = () => {
        switch(page) {
            case 'dashboard': return <DashboardPage />;
            case 'all_user': return <ManageUsersPage filter={null} />;
            case 'blocked_user': return <ManageUsersPage filter="blocked" />;
            case 'find_user': return <FindUserPage initialSearchTerm={globalSearchTerm} setPage={setPage} />;
            case 'manage_services': return <ManageServicesPage />;
            case 'number_history': return <NumberHistoryPage />;
            case 'manage_apis': return <ManageApisPage />;
            case 'manage_servers': return <ManageServersPage />;
            default: return <ContentPage title={sidebarItems.find(item => item.page === page)?.name || 'Page'} />;
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex">
            <div className={`fixed inset-0 z-40 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out md:hidden`}>
                <Sidebar page={page} setPage={setPage} isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />
            </div>
            {isSidebarOpen && <div className="fixed inset-0 bg-black opacity-50 z-30 md:hidden" onClick={() => setSidebarOpen(false)}></div>}
            
            <div className="hidden md:flex flex-shrink-0">
                <Sidebar page={page} setPage={setPage} />
            </div>
            
            <div className="flex-1 flex flex-col">
                <header className="bg-white shadow-sm h-16 flex items-center justify-between px-6">
                    <button className="md:hidden" onClick={() => setSidebarOpen(true)}><MenuIcon /></button>
                    <form onSubmit={handleGlobalSearch} className="relative w-1/3">
                        <input value={globalSearchTerm} onChange={e => setGlobalSearchTerm(e.target.value)} placeholder="Search user by email..." className="w-full border-gray-300 rounded-md pl-10" />
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    </form>
                    <div className="flex items-center space-x-4">
                        <select onChange={(e) => setCurrency(e.target.value)} className="border-gray-300 rounded-md">
                            <option value="USD">USD</option>
                            <option value="PKR">PKR</option>
                            <option value="INR">INR</option>
                        </select>
                        <p>{admin?.email}</p>
                        <button onClick={handleLogout} className="text-red-500 hover:text-red-700 font-semibold">Logout</button>
                    </div>
                </header>
                <main className="flex-1 p-6 overflow-y-auto">
                    {renderPage()}
                </main>
            </div>
        </div>
    );
};


// --- Main App Component ---

function App() {
    const [admin, setAdmin] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                const adminDocRef = doc(db, "admins", user.uid);
                const adminDoc = await getDoc(adminDocRef);
                if (adminDoc.exists() && adminDoc.data().role === 'admin') {
                    setAdmin(user);
                } else {
                    await signOut(auth);
                    setAdmin(null);
                }
            } else {
                setAdmin(null);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center bg-gray-100"><Spinner /></div>;
    }
    
    return (
        <CurrencyProvider>
            {admin ? <AdminPanel admin={admin} setAdmin={setAdmin} /> : <AdminLogin setAdmin={setAdmin} />}
        </CurrencyProvider>
    );
}

export default App;
