import React from 'react';
import UserManager from '../UserManager';
import './Users.css';

const Users = ({ onMessage, user }) => {
  return (
    <div className="page-users">
      <UserManager onMessage={onMessage} user={user} />
    </div>
  );
};

export default Users;
