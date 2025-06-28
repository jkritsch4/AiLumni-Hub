# UCSD Baseball Upcoming Games Update

## Changes Made to Match Mobile Design

### 1. **Reverted to UCSD Baseball**
- Set `currentSelectedTeam = 'UCSD Baseball'`
- Updated default team in Dashboard component
- Changed sport preference back to 'Baseball'

### 2. **Updated Upcoming Games Structure**
- **Team Display**: UCSD always shown on left, opponent on right (matches mobile design)
- **Logo Logic**: 
  - `ucsdLogo`: Always shows UCSD Triton logo on left
  - `opponentLogo`: Shows opponent logo (or default) on right
- **Team Names**: 
  - UCSD team name (removes "UCSD " prefix for cleaner display)
  - Opponent name on right

### 3. **Improved Time Formatting**
- **Format**: "FRI, MAR 14 AT 6:30 PM PDT" (matches mobile design)
- **Style**: All uppercase, shortened weekday and month
- Uses `start_time_utc` as the primary time field

### 4. **Enhanced Visual Design**
- **Logos**: Increased size to 80px (more prominent)
- **Typography**: Larger, bolder fonts using 'Bebas Neue'
- **VS. Section**: More prominent with 2em font size
- **Game Info**: Larger text (1.4em) with better spacing
- **Colors**: UCSD gold (#FFCD00) for accents

### 5. **Data Structure Confirmation**
```json
{
  "team_name": "UCSD Baseball",
  "start_time_utc": "2025-02-15T02:00:00+00:00", 
  "opponent_name": "Pacific",
  "game_outcome": "L 1-2",
  "game_location": "Location details"
}
```

## Mobile Design Elements Implemented

### ✅ **Team Layout**
- UCSD Triton logo (left) vs. Opponent logo (right)
- Team names below logos
- Centered "VS." between teams

### ✅ **Game Information**
- **TIME**: Formatted as "DAY, MON DD AT H:MM AM/PM TZ"
- **LOCATION**: Uppercase location text
- **FINAL/PENDING**: Shows "FINAL" for completed games, "VS." for upcoming

### ✅ **Typography & Styling**
- **Font**: Bebas Neue for headers and game info
- **Colors**: UCSD blue background, gold accents
- **Size**: Large, readable text matching mobile design
- **Spacing**: Proper spacing between elements

## Data Sources

### **UCSD Baseball Data Available**:
- ✅ Completed games with outcomes (L 1-2, etc.)
- ✅ Game dates using `start_time_utc`
- ✅ Opponent names
- ✅ Game locations
- ✅ UCSD Triton logo URL

### **Expected Display**:
1. **Recent Results**: Shows last 5 UCSD Baseball games
2. **Upcoming Games**: Shows next game or falls back to most recent with "NEW SCHEDULE PENDING"
3. **Proper Logos**: Triton logo for UCSD, default/opponent logos for others

The application now matches the mobile design structure and uses UCSD Baseball as the primary team with actual game data from the API!
