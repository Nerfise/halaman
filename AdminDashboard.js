// src/AdminDashboard.js
import React, { useEffect, useState } from 'react';
import { firestore } from './firebaseConfig';
import { collection, onSnapshot, updateDoc, doc } from 'firebase/firestore'; // Ensure these are imported
import './index.css';

const AdminDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = () => {
      setLoading(true);
      setError(null);

      try {
        const ordersCollection = collection(firestore, 'orders');
        const usersCollection = collection(firestore, 'users');
        const addressesCollection = collection(firestore, 'addresses');

        const unsubscribeOrders = onSnapshot(ordersCollection, (ordersSnapshot) => {
          const ordersList = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

          const unsubscribeUsers = onSnapshot(usersCollection, (usersSnapshot) => {
            const usersList = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            const unsubscribeAddresses = onSnapshot(addressesCollection, (addressesSnapshot) => {
              const addressesList = addressesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

              const enrichedOrders = ordersList.map(order => {
                const user = usersList.find(user => user.id === order.userId);
                const address = addressesList.find(address => address.id === order.addressId);

                return {
                  id: order.id,
                  ...order,
                  username: user ? user.email : 'Unknown User',
                  userAddress: address ? `${address.street}, ${address.city}` : 'Unknown Address',
                  date: new Date(order.date).toLocaleDateString() // Fetching and formatting the date
                };
              });

              setOrders(enrichedOrders);
              setLoading(false);
            });

            return () => {
              unsubscribeUsers();
              unsubscribeAddresses();
            };
          });

          return () => {
            unsubscribeOrders();
          };
        });

      } catch (error) {
        setError(error.message);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const markAsDelivered = async (orderId) => {
    const confirm = window.confirm("Are you sure you want to mark this order as delivered?");
    if (confirm) {
      const orderRef = doc(firestore, 'orders', orderId);
      await updateDoc(orderRef, { status: 'Delivered' });

      // Update local state to move the order from pending to delivered
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === orderId ? { ...order, status: 'Delivered' } : order
        )
      );
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  const pendingOrders = orders.filter(order => order.status === 'Pending') || [];
  const deliveredOrders = orders.filter(order => order.status === 'Delivered') || [];

  return (
    <div className="admin-dashboard">
      <h1>Admin Dashboard</h1>

      {/* Pending Orders Table */}
      <h2>Pending Orders</h2>
      <table className="order-table">
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Order</th>
            <th>Date</th>
            <th>Username</th>
            <th>Address</th>
            <th>Items</th>
            <th>Payment Method</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {pendingOrders.length > 0 ? pendingOrders.map(order => (
            <tr key={order.id}>
              <td>{order.id}</td>
              <td>{order.items.map(item => item.name).join(', ')}</td>
              <td>{order.date}</td>
              <td>{order.username}</td>
              <td>{order.userAddress}</td>
              <td>{order.items.length} items</td>
              <td>{order.paymentMethod}</td>
              <td>{order.status}</td>
              <td>
                <button onClick={() => markAsDelivered(order.id)}>Mark as Delivered</button>
              </td>
            </tr>
          )) : (
            <tr>
              <td colSpan="9">No pending orders</td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Delivered Orders Table */}
      <h2>Delivered Orders</h2>
      <table className="order-table">
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Order</th>
            <th>Date</th>
            <th>Username</th>
            <th>Address</th>
            <th>Items</th>
            <th>Payment Method</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {deliveredOrders.length > 0 ? deliveredOrders.map(order => (
            <tr key={order.id}>
              <td>{order.id}</td>
              <td>{order.items.map(item => item.name).join(', ')}</td>
              <td>{order.date}</td>
              <td>{order.username}</td>
              <td>{order.userAddress}</td>
              <td>{order.items.length} items</td>
              <td>{order.paymentMethod}</td>
              <td>{order.status}</td>
              <td><button disabled>Delivered</button></td>
            </tr>
          )) : (
            <tr>
              <td colSpan="9">No delivered orders</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default AdminDashboard;
