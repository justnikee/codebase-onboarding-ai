# 🧪 Testing Guide

Complete guide for testing the AI Developer Onboarding Assistant.

## 📋 Pre-Testing Checklist

- [ ] Backend running on port 5000
- [ ] Frontend running on port 3000
- [ ] `USE_MOCK_WATSONX=true` in backend/.env
- [ ] Both terminals showing no errors
- [ ] Can access http://localhost:3000

---

## 🎯 Test Scenarios

### 1. Repository Analysis Test

**Objective:** Verify repository analysis works end-to-end

**Test Repositories:**

#### Small Repo (Fast - 30 seconds)
```
https://github.com/sindresorhus/is
```
- Simple, well-documented
- Good for quick tests
- Clear structure

#### Medium Repo (Moderate - 1-2 minutes)
```
https://github.com/expressjs/express
```
- Popular framework
- Good documentation
- Multiple file types

#### Large Repo (Slow - 2-3 minutes)
```
https://github.com/facebook/react
```
- Complex structure
- Many files
- Tests system limits

**Steps:**
1. Open http://localhost:3000
2. Paste repository URL
3. Click "Analyze Repository"
4. Wait for analysis to complete
5. Verify dashboard loads

**Expected Results:**
- ✅ Loading spinner appears
- ✅ No errors in console
- ✅ Redirects to dashboard
- ✅ Shows project summary
- ✅ Displays tech stack
- ✅ Lists setup steps
- ✅ Shows architecture explanation

**Common Issues:**
- ❌ "Repository not found" → Check URL format
- ❌ "Rate limit exceeded" → Add GitHub token or wait
- ❌ Timeout → Try smaller repo first

---

### 2. Dashboard Display Test

**Objective:** Verify all dashboard components render correctly

**Steps:**
1. After analysis completes, check dashboard
2. Verify all sections are visible
3. Check data accuracy

**Checklist:**
- [ ] Repository name displayed
- [ ] Star/fork counts shown
- [ ] Language detected
- [ ] Last updated date shown
- [ ] Project summary readable
- [ ] Setup steps numbered correctly
- [ ] Architecture explanation present
- [ ] Tech stack badges displayed
- [ ] Languages listed
- [ ] Frameworks listed
- [ ] Tools listed
- [ ] Quick actions work
- [ ] "Ask Questions" button works
- [ ] "View on GitHub" opens repo
- [ ] "Analyze Another Repo" returns home

**Expected Results:**
- ✅ All sections populated with data
- ✅ No "undefined" or "null" values
- ✅ Proper formatting
- ✅ Responsive layout

---

### 3. Chat Functionality Test

**Objective:** Verify context-aware chatbot works

**Steps:**
1. Click "Ask Questions" from dashboard
2. Try suggested questions
3. Ask custom questions
4. Verify responses

**Test Questions:**

#### Basic Questions
```
How do I set up this project?
What is this project about?
What technologies does it use?
```

#### Specific Questions
```
Where is authentication handled?
How do I run the tests?
What API endpoints are available?
How is the database configured?
```

#### Edge Cases
```
[Empty message] → Should not send
[Very long message] → Should handle gracefully
[Special characters: @#$%] → Should work
```

**Expected Results:**
- ✅ Suggested questions appear
- ✅ Can click suggestions to ask
- ✅ Can type custom questions
- ✅ Loading indicator while processing
- ✅ Response appears in chat
- ✅ Relevant files shown (if any)
- ✅ Confidence score displayed
- ✅ Timestamp shown
- ✅ Chat history maintained
- ✅ Smooth scrolling to new messages

**Verify Context-Awareness:**
- ✅ Answers reference specific files
- ✅ Mentions actual project details
- ✅ Not generic responses
- ✅ Shows relevant file paths

---

### 4. Error Handling Test

**Objective:** Verify app handles errors gracefully

**Test Cases:**

#### Invalid Repository URL
```
Input: https://github.com/invalid/nonexistent
Expected: Error message "Repository not found"
```

#### Malformed URL
```
Input: not-a-url
Expected: Validation error before submission
```

#### Backend Offline
```
Steps:
1. Stop backend server
2. Try to analyze repo
Expected: Connection error with retry option
```

#### Network Timeout
```
Steps:
1. Analyze very large repo
2. Wait for timeout
Expected: Timeout error with helpful message
```

**Expected Results:**
- ✅ Clear error messages
- ✅ No app crashes
- ✅ Retry options available
- ✅ Can return to home
- ✅ Errors logged to console

---

### 5. UI/UX Test

**Objective:** Verify user experience is smooth

**Checklist:**

#### Visual Design
- [ ] Colors consistent
- [ ] Fonts readable
- [ ] Icons display correctly
- [ ] Spacing appropriate
- [ ] Borders and shadows subtle

#### Responsiveness
- [ ] Works on desktop (1920x1080)
- [ ] Works on laptop (1366x768)
- [ ] Works on tablet (768x1024)
- [ ] Works on mobile (375x667)

#### Interactions
- [ ] Buttons have hover effects
- [ ] Loading states clear
- [ ] Transitions smooth
- [ ] Forms validate input
- [ ] Error states visible

#### Accessibility
- [ ] Can tab through elements
- [ ] Focus indicators visible
- [ ] Alt text on images
- [ ] Semantic HTML used
- [ ] Color contrast sufficient

---

### 6. Performance Test

**Objective:** Verify app performs well

**Metrics to Check:**

#### Load Times
- Home page: < 1 second
- Dashboard: < 2 seconds
- Chat page: < 1 second

#### Analysis Times
- Small repo: 30-60 seconds
- Medium repo: 1-2 minutes
- Large repo: 2-3 minutes

#### Chat Response Times
- Simple question: 1-3 seconds
- Complex question: 3-5 seconds

**Tools:**
- Browser DevTools → Network tab
- Browser DevTools → Performance tab
- Console logs for timing

**Expected Results:**
- ✅ No memory leaks
- ✅ No excessive re-renders
- ✅ Smooth animations
- ✅ Fast page transitions

---

### 7. Mock Mode Test

**Objective:** Verify mock service works correctly

**Steps:**
1. Ensure `USE_MOCK_WATSONX=true` in backend/.env
2. Restart backend
3. Check console for mock mode message
4. Analyze a repository
5. Verify mock responses

**Expected Console Output:**
```
⚠️  Running in MOCK mode - IBM watsonx credentials not required
⚠️  Using MOCK watsonx service
```

**Expected Behavior:**
- ✅ Analysis completes successfully
- ✅ Generates reasonable summaries
- ✅ Detects tech stack from files
- ✅ Creates setup steps
- ✅ Chat responds appropriately
- ✅ No API authentication errors

---

### 8. Integration Test

**Objective:** Test complete user flow

**Scenario: New User Onboarding**

1. **User arrives at home page**
   - Sees clear value proposition
   - Understands what to do
   - Sees example repositories

2. **User enters repository URL**
   - Validation works
   - Loading state clear
   - Can't submit invalid URL

3. **Analysis runs**
   - Progress indicator visible
   - User knows what's happening
   - Can't navigate away accidentally

4. **Dashboard displays**
   - All information clear
   - Can understand project quickly
   - Knows next steps

5. **User asks questions**
   - Chat interface intuitive
   - Suggestions helpful
   - Responses useful

6. **User explores more**
   - Can analyze another repo
   - Can return to dashboard
   - Can share results

**Success Criteria:**
- ✅ User completes flow without confusion
- ✅ No errors encountered
- ✅ User finds value in results
- ✅ User wants to use again

---

## 🐛 Bug Reporting Template

When you find a bug, report it with:

```markdown
**Bug Description:**
[Clear description of the issue]

**Steps to Reproduce:**
1. Go to...
2. Click on...
3. See error...

**Expected Behavior:**
[What should happen]

**Actual Behavior:**
[What actually happens]

**Environment:**
- OS: [Windows/Mac/Linux]
- Browser: [Chrome/Firefox/Safari]
- Backend: [Running/Not Running]
- Mock Mode: [Yes/No]

**Screenshots:**
[If applicable]

**Console Errors:**
[Copy any error messages]
```

---

## ✅ Test Results Template

```markdown
## Test Session: [Date]

### Environment
- Backend: ✅ Running
- Frontend: ✅ Running
- Mock Mode: ✅ Enabled

### Test Results

#### Repository Analysis
- Small repo: ✅ Pass
- Medium repo: ✅ Pass
- Large repo: ⚠️ Slow but works

#### Dashboard
- All sections: ✅ Pass
- Responsive: ✅ Pass

#### Chat
- Suggestions: ✅ Pass
- Custom questions: ✅ Pass
- Context-aware: ✅ Pass

#### Error Handling
- Invalid URL: ✅ Pass
- Network errors: ✅ Pass

#### Performance
- Load times: ✅ Acceptable
- Response times: ✅ Good

### Issues Found
1. [Issue description]
2. [Issue description]

### Notes
[Any additional observations]
```

---

## 🚀 Automated Testing (Future)

For production, consider adding:

### Backend Tests
```bash
cd backend
npm test
```

### Frontend Tests
```bash
cd frontend
npm test
```

### E2E Tests
```bash
npm run test:e2e
```

---

## 📊 Performance Benchmarks

### Target Metrics

| Metric | Target | Acceptable | Poor |
|--------|--------|------------|------|
| Home page load | < 1s | < 2s | > 2s |
| Analysis (small) | < 1min | < 2min | > 2min |
| Chat response | < 3s | < 5s | > 5s |
| Dashboard load | < 2s | < 3s | > 3s |

---

## 🎯 Testing Priorities

### High Priority (Must Test)
1. ✅ Repository analysis works
2. ✅ Dashboard displays correctly
3. ✅ Chat functionality works
4. ✅ Error handling graceful

### Medium Priority (Should Test)
1. ✅ Performance acceptable
2. ✅ UI responsive
3. ✅ All features accessible

### Low Priority (Nice to Test)
1. ✅ Edge cases handled
2. ✅ Accessibility features
3. ✅ Browser compatibility

---

## 📝 Testing Checklist

Before considering testing complete:

- [ ] Tested with 3+ different repositories
- [ ] Verified all dashboard sections
- [ ] Tested chat with 5+ questions
- [ ] Checked error handling
- [ ] Verified responsive design
- [ ] Tested in 2+ browsers
- [ ] Checked console for errors
- [ ] Verified mock mode works
- [ ] Tested all navigation flows
- [ ] Checked performance metrics

---

**🎉 Happy Testing! Report any issues you find.**