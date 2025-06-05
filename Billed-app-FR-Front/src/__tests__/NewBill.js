/**
 * @jest-environment jsdom
 */

import { screen, waitFor, fireEvent } from "@testing-library/dom"
import userEvent from '@testing-library/user-event'
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import { ROUTES_PATH, ROUTES } from "../constants/routes.js"
import { localStorageMock } from "../__mocks__/localStorage.js"
import mockStore from "../__mocks__/store"
import router from "../app/Router.js"

jest.mock("../app/store", () => mockStore)

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    test("Then the form should be displayed", () => {
      // Nettoyer le DOM avant le test
      document.body.innerHTML = ""
      
      const html = NewBillUI()
      document.body.innerHTML = html
      
      // Vérification que le formulaire est affiché
      const form = screen.getByTestId("form-new-bill")
      expect(form).toBeTruthy()
      
      // Vérification des champs du formulaire
      expect(screen.getByTestId("expense-type")).toBeTruthy()
      expect(screen.getByTestId("expense-name")).toBeTruthy()
      expect(screen.getByTestId("datepicker")).toBeTruthy()
      expect(screen.getByTestId("amount")).toBeTruthy()
      expect(screen.getByTestId("vat")).toBeTruthy()
      expect(screen.getByTestId("pct")).toBeTruthy()
      expect(screen.getByTestId("commentary")).toBeTruthy()
      expect(screen.getByTestId("file")).toBeTruthy()
      expect(screen.getByRole("button", { name: /envoyer/i })).toBeTruthy()
    })
    
    describe("When I upload a file with an allowed extension", () => {
      test("Then the file should be accepted", async () => {
        // Nettoyer le DOM avant le test
        document.body.innerHTML = ""
        
        // Préparation du DOM et du mock de localStorage
        Object.defineProperty(window, 'localStorage', { value: localStorageMock })
        window.localStorage.setItem('user', JSON.stringify({ type: 'Employee', email: 'employee@test.tld' }))
        
        // Préparation du DOM
        document.body.innerHTML = NewBillUI()
        
        // Création de l'instance NewBill avec les mocks
        const onNavigate = jest.fn()
        const newBill = new NewBill({
          document,
          onNavigate,
          store: mockStore,
          localStorage: window.localStorage
        })
        
        // Mock de la méthode bills().create()
        const createMock = jest.fn().mockResolvedValue({ fileUrl: 'http://example.com/image.jpg', key: '1234' })
        jest.spyOn(mockStore.bills(), 'create').mockImplementation(createMock)
        
        // Simulation de l'upload d'un fichier valide
        const handleChangeFile = jest.fn(newBill.handleChangeFile)
        
        // Créer un event personnalisé
        const event = {
          preventDefault: jest.fn(),
          target: {
            value: 'C:\\fakepath\\image.jpg',
            files: [new File(['image content'], 'image.jpg', { type: 'image/jpeg' })]
          }
        }
        
        // Appeler directement la méthode avec l'event personnalisé
        handleChangeFile(event)
        
        // Vérification
        expect(createMock).toHaveBeenCalled()
      })
    })
    
    describe("When I upload a file with a disallowed extension", () => {
      test("Then the file should be rejected", () => {
        // Nettoyer le DOM avant le test
        document.body.innerHTML = ""
        
        // Préparation du DOM et du mock de localStorage
        Object.defineProperty(window, 'localStorage', { value: localStorageMock })
        window.localStorage.setItem('user', JSON.stringify({ type: 'Employee', email: 'employee@test.tld' }))
        
        // Préparation du DOM
        document.body.innerHTML = NewBillUI()
        
        // Mock de alert
        global.alert = jest.fn()
        
        // Création de l'instance NewBill avec les mocks
        const onNavigate = jest.fn()
        const newBill = new NewBill({
          document,
          onNavigate,
          store: mockStore,
          localStorage: window.localStorage
        })
        
        // Simulation de l'upload d'un fichier invalide
        const handleChangeFile = jest.fn(newBill.handleChangeFile)
        
        // Créer un event personnalisé
        const event = {
          preventDefault: jest.fn(),
          target: {
            value: 'C:\\fakepath\\document.pdf',
            files: [new File(['document content'], 'document.pdf', { type: 'application/pdf' })]
          }
        }
        
        // Appeler directement la méthode avec l'event personnalisé
        handleChangeFile(event)
        
        // Vérification
        expect(global.alert).toHaveBeenCalledWith('Seuls les fichiers jpg, jpeg ou png sont acceptés')
      })
    })
    
    describe("When I submit the form with valid data", () => {
      test("Then a new bill should be created and I should be redirected to Bills page", () => {
        // Nettoyer le DOM avant le test
        document.body.innerHTML = ""
        
        // Préparation du DOM et du mock de localStorage
        Object.defineProperty(window, 'localStorage', { value: localStorageMock })
        window.localStorage.setItem('user', JSON.stringify({ type: 'Employee', email: 'employee@test.tld' }))
        
        // Préparation du DOM
        document.body.innerHTML = NewBillUI()
        
        // Création de l'instance NewBill avec les mocks
        const onNavigate = jest.fn()
        const newBill = new NewBill({
          document,
          onNavigate,
          store: mockStore,
          localStorage: window.localStorage
        })
        
        // Préparation des données du formulaire
        newBill.fileUrl = 'http://example.com/image.jpg'
        newBill.fileName = 'image.jpg'
        newBill.billId = '1234'
        
        // Remplissage du formulaire
        screen.getByTestId("expense-type").value = "Transports"
        screen.getByTestId("expense-name").value = "Test transport"
        screen.getByTestId("datepicker").value = "2023-01-01"
        screen.getByTestId("amount").value = "100"
        screen.getByTestId("vat").value = "20"
        screen.getByTestId("pct").value = "20"
        screen.getByTestId("commentary").value = "Test commentaire"
        
        // Mock de la méthode updateBill
        const updateBillMock = jest.fn()
        newBill.updateBill = updateBillMock
        
        // Simulation de la soumission du formulaire
        const form = screen.getByTestId("form-new-bill")
        fireEvent.submit(form)
        
        // Vérification
        expect(updateBillMock).toHaveBeenCalled()
        expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH['Bills'])
      })
    })
  })
})

// Tests d'intégration POST
describe("Given I am a user connected as Employee", () => {
  describe("When I navigate to NewBill page", () => {
    test("Then I should see the new bill form", async () => {
      // Nettoyer le DOM avant le test
      document.body.innerHTML = ""
      
      // Préparation
      localStorage.setItem("user", JSON.stringify({ type: "Employee", email: "employee@test.tld" }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      
      // Navigation vers la page NewBill
      window.onNavigate(ROUTES_PATH.NewBill)
      
      // Attente que la page soit chargée et vérification
      await waitFor(() => {
        const form = document.querySelector(`form[data-testid="form-new-bill"]`)
        expect(form).toBeTruthy()
      })
    })
  })
  
  describe("When an error occurs on API", () => {
    beforeEach(() => {
      // Nettoyer le DOM avant le test
      document.body.innerHTML = ""
      
      jest.spyOn(mockStore, "bills")
      Object.defineProperty(
        window,
        'localStorage',
        { value: localStorageMock }
      )
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee',
        email: "employee@test.tld"
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.appendChild(root)
      router()
    })
    
    test("fetches bills from an API and fails with 404 message error", async () => {
      // Spy sur console.error avant de configurer le mock
      const consoleSpy = jest.spyOn(console, 'error')
      
      // Mock de l'erreur 404 pour create
      mockStore.bills.mockImplementationOnce(() => {
        return {
          create: () => {
            return Promise.reject(new Error("Erreur 404"))
          }
        }
      })
      
      // Navigation vers la page NewBill
      window.onNavigate(ROUTES_PATH.NewBill)
      
      // Attente que la page soit chargée
      await waitFor(() => {
        const form = document.querySelector(`form[data-testid="form-new-bill"]`)
        expect(form).toBeTruthy()
      })
      
      // Création d'une instance de NewBill
      const newBill = new NewBill({
        document,
        onNavigate: window.onNavigate,
        store: mockStore,
        localStorage: window.localStorage
      })
      
      // Simulation de l'upload d'un fichier qui va échouer
      const event = {
        preventDefault: jest.fn(),
        target: {
          value: 'C:\\fakepath\\image.jpg',
          files: [new File(['image content'], 'image.jpg', { type: 'image/jpeg' })]
        }
      }
      
      // Appel direct de la méthode qui va échouer et attente explicite de la réjection
      try {
        await newBill.handleChangeFile(event)
      } catch (error) {
        // Si une erreur est levée, c'est normal
      }
      
      // Attente pour s'assurer que le console.error a été appelé
      await new Promise(process.nextTick)
      
      // Vérification
      expect(consoleSpy).toHaveBeenCalled()
    })
    
    test("fetches bills from an API and fails with 500 message error", async () => {
      // Spy sur console.error avant de configurer le mock
      const consoleSpy = jest.spyOn(console, 'error')
      
      // Mock de l'erreur 500 pour create
      mockStore.bills.mockImplementationOnce(() => {
        return {
          create: () => {
            return Promise.reject(new Error("Erreur 500"))
          }
        }
      })
      
      // Navigation vers la page NewBill
      window.onNavigate(ROUTES_PATH.NewBill)
      
      // Attente que la page soit chargée
      await waitFor(() => {
        const form = document.querySelector(`form[data-testid="form-new-bill"]`)
        expect(form).toBeTruthy()
      })
      
      // Création d'une instance de NewBill
      const newBill = new NewBill({
        document,
        onNavigate: window.onNavigate,
        store: mockStore,
        localStorage: window.localStorage
      })
      
      // Simulation de l'upload d'un fichier qui va échouer
      const event = {
        preventDefault: jest.fn(),
        target: {
          value: 'C:\\fakepath\\image.jpg',
          files: [new File(['image content'], 'image.jpg', { type: 'image/jpeg' })]
        }
      }
      
      // Appel direct de la méthode qui va échouer et attente explicite de la réjection
      try {
        await newBill.handleChangeFile(event)
      } catch (error) {
        // Si une erreur est levée, c'est normal
      }
      
      // Attente pour s'assurer que le console.error a été appelé
      await new Promise(process.nextTick)
      
      // Vérification
      expect(consoleSpy).toHaveBeenCalled()
    })
  })
})
