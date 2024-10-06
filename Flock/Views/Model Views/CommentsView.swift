// CommentsView.swift
// Flock 
//
// provides the UI for viewing and adding comments
//
// Created by Ramon Jiang 09/011/24

import SwiftUI

struct CommentsView: View {
    let postID: String
    @StateObject private var viewModel: CommentViewModel
    @State private var newCommentText = ""
    @Environment(UserProfileHolder.self) var userHolder
    @FocusState private var isCommentFieldFocused: Bool
    var isModal: Bool = false
    @Binding var isPresented: Bool
    
    init(postID: String, isModal: Bool = false, isPresented: Binding<Bool> = .constant(true)) {
        self.postID = postID
        self.isModal = isModal
        self._isPresented = isPresented
        self._viewModel = StateObject(wrappedValue: CommentViewModel())
    }
    
    var body: some View {
        VStack {
            if viewModel.isLoading {
                ProgressView("Loading comments...")
            } else if let errorMessage = viewModel.errorMessage {
                Text(errorMessage)
                    .foregroundColor(.red)
            } else {
                List(viewModel.comments) { comment in
                    CommentRowView(comment: comment)
                }
                .listStyle(PlainListStyle())
            }
            
            commentInputField
        }
        .onAppear {
            Task {
                await viewModel.fetchComments(for: postID)
            }
        }
    }
    
    private var commentInputField: some View {
        HStack {
            TextField("Add a comment", text: $newCommentText)
                .textFieldStyle(RoundedBorderTextFieldStyle())
                .focused($isCommentFieldFocused)
                .submitLabel(.send)
                .onSubmit(postComment)
            
            Button("Post", action: postComment)
                .disabled(newCommentText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
        }
        .padding()
    }
    
    private func postComment() {
        Task {
            await viewModel.addComment(to: postID, text: newCommentText, person: userHolder.person)
            newCommentText = ""
            isCommentFieldFocused = false
        }
    }
}

struct CommentRowView: View {
    let comment: Comment
    
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(comment.username)
                .font(.headline)
            Text(comment.text)
            Text(comment.createdAt, style: .relative)
                .font(.caption)
                .foregroundColor(.secondary)
        }
    }
}
