import "@testing-library/jest-dom"

// Configure axe-core to use jsdom's document implementation
// This ensures axe runs correctly in the test environment
import { configure } from "axe-core"
configure({ allowedOrigins: ["<same_origin>"] })
