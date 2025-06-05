/**
 * @jest-environment jsdom
 */

import {screen, waitFor} from "@testing-library/dom"
import userEvent from '@testing-library/user-event'
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import { ROUTES_PATH, ROUTES } from "../constants/routes.js";
import {localStorageMock} from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store"
import router from "../app/Router.js";
import Bills from "../containers/Bills.js";

jest.mock("../app/store", () => mockStore)

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      expect(windowIcon.classList.contains('active-icon')).toBe(true)

    })
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })

    describe("When I click on the new bill button", () => {
      test("Then I should be sent to the NewBill page", () => {
        // Préparation du DOM
        document.body.innerHTML = BillsUI({ data: bills })
        
        // Initialisation des fonctions nécessaires
        const onNavigate = jest.fn()
        const billsInstance = new Bills({
          document,
          onNavigate,
          store: null,
          localStorage: window.localStorage
        })

        // Simulation du clic sur le bouton
        const newBillButton = screen.getByTestId('btn-new-bill')
        const handleClickNewBill = jest.fn(() => billsInstance.handleClickNewBill())
        newBillButton.addEventListener('click', handleClickNewBill)
        userEvent.click(newBillButton)

        // Vérification
        expect(handleClickNewBill).toHaveBeenCalled()
        expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH['NewBill'])
      })
    })

    describe("When I click on the eye icon", () => {
      test("Then a modal should open with the bill proof", () => {
        // Préparation du DOM avec jQuery
        $.fn.modal = jest.fn() // Mock de la fonction modal de jQuery
        document.body.innerHTML = BillsUI({ data: bills })
        
        // Initialisation
        const billsInstance = new Bills({
          document,
          onNavigate: null,
          store: null,
          localStorage: window.localStorage
        })

        // Simulation du clic sur l'icône
        const iconEye = screen.getAllByTestId('icon-eye')[0]
        const handleClickIconEye = jest.fn(() => billsInstance.handleClickIconEye(iconEye))
        iconEye.addEventListener('click', handleClickIconEye)
        userEvent.click(iconEye)

        // Vérification
        expect(handleClickIconEye).toHaveBeenCalled()
        expect($.fn.modal).toHaveBeenCalledWith('show')
      })
    })

    describe("When I navigate to Bills page", () => {
      test("Then the bills should be fetched and formatted correctly", async () => {
        // Préparation
        const billsInstance = new Bills({
          document,
          onNavigate: null,
          store: mockStore,
          localStorage: window.localStorage
        })

        // Appel de la méthode getBills
        const bills = await billsInstance.getBills()

        // Vérification
        expect(bills.length).toBe(4) // Nombre de factures dans le mock
        expect(bills[0].date).not.toBe(undefined) // Vérification du formatage des dates
        expect(bills[0].status).not.toBe(undefined) // Vérification du formatage des statuts
      })
    })
  })
})

// Tests d'intégration GET
describe("Given I am a user connected as Employee", () => {
  describe("When I navigate to Bills page", () => {
    test("fetches bills from mock API GET", async () => {
      // Préparation
      localStorage.setItem("user", JSON.stringify({ type: "Employee", email: "employee@test.tld" }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()

      // Navigation
      window.onNavigate(ROUTES_PATH.Bills)
      
      // Attente et vérification
      await waitFor(() => screen.getByText("Mes notes de frais"))
      expect(screen.getByTestId("tbody")).toBeTruthy()
      expect(screen.getAllByText("test1")).toBeTruthy() // Vérifie qu'une facture du mock est affichée
    })

    describe("When an error occurs on API", () => {
      beforeEach(() => {
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
        // Mock de l'erreur 404
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error("Erreur 404"))
            }
          }
        })

        // Navigation
        window.onNavigate(ROUTES_PATH.Bills)
        
        // Attente et vérification
        await new Promise(process.nextTick)
        const message = await screen.getByText(/Erreur 404/)
        expect(message).toBeTruthy()
      })

      test("fetches bills from an API and fails with 500 message error", async () => {
        // Mock de l'erreur 500
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error("Erreur 500"))
            }
          }
        })

        // Navigation
        window.onNavigate(ROUTES_PATH.Bills)
        
        // Attente et vérification
        await new Promise(process.nextTick)
        const message = await screen.getByText(/Erreur 500/)
        expect(message).toBeTruthy()
      })
    })
  })
})
