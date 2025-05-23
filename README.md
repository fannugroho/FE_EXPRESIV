# Kansai Paint Expressiv System - React Application

A comprehensive financial management system for PT Kansai Paint Indonesia, built with React.js. This system handles Purchase Requests, Reimbursements, Cash Advances, and Settlement processes with a modern, responsive interface.

## 🚀 Features

### Core Functionality
- **User Authentication** - Login system with multi-language support (English/Japanese)
- **Dashboard** - Real-time statistics and quick actions
- **Purchase Request Management** - Create, view, edit, and track purchase requests
- **Reimbursement System** - Handle expense reimbursements
- **Cash Advance Management** - Manage cash advance requests
- **Settlement Processing** - Process financial settlements
- **User Profile Management** - Edit user information and avatar
- **Approval Workflow** - Multi-level approval system

### Technical Features
- **Responsive Design** - Works on desktop, tablet, and mobile
- **Modern UI** - Built with Tailwind CSS and Font Awesome icons
- **Local Storage** - Data persistence using browser local storage
- **React Router** - Client-side routing for SPA experience
- **Component-based Architecture** - Reusable React components

## 🛠️ Technology Stack

- **Frontend**: React 18.2.0
- **Routing**: React Router DOM 6.11.1
- **Styling**: Tailwind CSS 2.2.19
- **Icons**: Font Awesome 6
- **Build Tool**: Create React App
- **Language**: JavaScript (ES6+)

## 📁 Project Structure

```
src/
├── components/
│   ├── Dashboard.jsx       # Main dashboard component
│   ├── Login.jsx          # Login page with language toggle
│   ├── Profile.jsx        # User profile management
│   ├── Sidebar.jsx        # Navigation sidebar
│   ├── Header.jsx         # Top header with notifications
│   ├── Layout.jsx         # Main layout wrapper
│   ├── MenuPR.jsx         # Purchase request list
│   ├── AddPR.jsx          # Add new purchase request
│   └── shared.css         # Shared component styles
├── index.js               # Application entry point
└── index.css              # Global styles

public/
├── index.html             # HTML template
├── image/                 # Static images
│   ├── Seiho.png         # Company logo
│   ├── English.png       # English flag
│   └── Japanese.png      # Japanese flag
└── manifest.json          # PWA manifest
```

## 🚀 Getting Started

### Prerequisites
- Node.js (version 14 or higher)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd FE_EXPRESIV
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000`

### Building for Production

```bash
npm run build
```

This creates a `build` folder with optimized production files.

## 🔐 Authentication

The system uses localStorage for user management. To get started:

1. **Default Login**: The system expects user data in localStorage
2. **User Registration**: Use the registration feature to create new users
3. **Multi-language**: Toggle between English and Japanese using the flag button

### Sample User Data Structure
```javascript
{
  "usercode": "admin",
  "password": "password123",
  "name": "Administrator",
  "email": "admin@kansaipaint.com",
  "role": "Admin",
  "department": "IT"
}
```

## 📊 Data Management

The application uses browser localStorage for data persistence:

- **Users**: `localStorage.getItem("users")`
- **Documents**: `localStorage.getItem("documents")`
- **User Avatar**: `localStorage.getItem("userAvatar")`
- **Logged In User**: `localStorage.getItem("loggedInUserCode")`

## 🎨 UI Components

### Layout Components
- **Layout**: Main wrapper with sidebar and header
- **Sidebar**: Collapsible navigation menu
- **Header**: User info and notifications

### Page Components
- **Dashboard**: Statistics and quick actions
- **Login**: Authentication with language toggle
- **Profile**: User profile management
- **MenuPR**: Purchase request listing with filters
- **AddPR**: Form for creating purchase requests

### Styling
- **Tailwind CSS**: Utility-first CSS framework
- **Custom CSS**: Additional styles in `shared.css`
- **Responsive Design**: Mobile-first approach

## 🔄 Navigation Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | Login (redirect) | Root redirects to login |
| `/login` | Login | User authentication |
| `/dashboard` | Dashboard | Main dashboard |
| `/profile` | Profile | User profile |
| `/add-pr` | MenuPR | Purchase request list |
| `/check-pr` | MenuPR | Check purchase requests |
| `/acknow-pr` | MenuPR | Acknowledge requests |
| `/approv-pr` | MenuPR | Approve requests |
| `/receive-pr` | MenuPR | Receive requests |
| `/add-reim` | MenuPR | Reimbursement management |
| `/add-cash` | MenuPR | Cash advance management |
| `/add-settle` | MenuPR | Settlement management |
| `/register` | MenuPR | User registration |
| `/user-list` | MenuPR | User management |
| `/role-list` | MenuPR | Role management |

## 🔧 Development

### Adding New Components

1. Create component in `src/components/`
2. Import and add route in `index.js`
3. Update navigation in `Sidebar.jsx`

### Styling Guidelines

- Use Tailwind CSS classes for styling
- Add custom styles to `shared.css` if needed
- Follow responsive design principles
- Use consistent color scheme (blue/red gradient)

### State Management

- Use React hooks (useState, useEffect)
- localStorage for data persistence
- React Router for navigation state

## 🚀 Deployment

### Development
```bash
npm start
```

### Production Build
```bash
npm run build
npm install -g serve
serve -s build
```

### Environment Variables
Create `.env` file for environment-specific settings:
```
REACT_APP_API_URL=your-api-url
REACT_APP_VERSION=1.0.0
```

## 🔍 Features in Detail

### Dashboard
- Real-time document statistics
- Quick action buttons
- Recent activity feed
- User welcome section

### Purchase Request Management
- Create new requests with multiple items
- Search and filter functionality
- Status tracking (Open, Prepared, Checked, etc.)
- Export to Excel/PDF (placeholder)
- Pagination for large datasets

### User Profile
- Edit personal information
- Upload avatar image
- Activity history
- Role and department management

### Responsive Design
- Mobile-friendly sidebar
- Adaptive layouts
- Touch-friendly interactions
- Optimized for all screen sizes

## 🐛 Troubleshooting

### Common Issues

1. **Blank page on load**
   - Check browser console for errors
   - Ensure all dependencies are installed
   - Clear browser cache

2. **Login not working**
   - Check localStorage for user data
   - Verify user credentials
   - Check browser developer tools

3. **Styling issues**
   - Ensure Tailwind CSS is loaded
   - Check for CSS conflicts
   - Verify Font Awesome is loaded

### Browser Support
- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## 📝 License

This project is proprietary software for PT Kansai Paint Indonesia.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For technical support or questions:
- Email: support@kansaipaint.com
- Internal IT Department

---

**Built with ❤️ for PT Kansai Paint Indonesia** 