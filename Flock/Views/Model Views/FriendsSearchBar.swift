////
////  FriendsSearchBar.swift
////  Flock
////
////  Created by Matt Lam on 8/6/24.
////
//
//import SwiftUI
//
//struct FriendsSearchBar: UIViewRepresentable {
//    @Binding var text: String
//        
//        class Coordinator: NSObject, UISearchBarDelegate {
//            @Binding var text: String
//            
//            init(text: Binding<String>) {
//                _text = text
//            }
//            
//            func searchBar(_ searchBar: UISearchBar, textDidChange searchText: String) {
//                text = searchText
//            }
//        }
//        
//        func makeCoordinator() -> Coordinator {
//            return Coordinator(text: $text)
//        }
//        
//        func makeUIView(context: Context) -> UISearchBar {
//            let searchBar = UISearchBar(frame: .zero)
//            searchBar.delegate = context.coordinator
//            return searchBar
//        }
//        
//        func updateUIView(_ uiView: UISearchBar, context: Context) {
//            uiView.text = text
//        }
//}
////
////#Preview {
////    FriendsSearchBar()
////}
